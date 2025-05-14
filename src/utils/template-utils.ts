// @ts-ignore - nunjucks doesn't export these types properly
import nunjucks from 'nunjucks/browser/nunjucks';
import { Database } from '@/app/__generated__/supabase.types';
// @ts-ignore - nunjucks doesn't export these types properly
import { transform } from 'nunjucks/src/transformer';

type ParsedVariable = {
  name: string;
  type: Database['public']['Enums']['variable_type'];
  required: boolean;
  default_value: string | null;
  children?: ParsedVariable[];
};

/**
 * Walks through the Nunjucks AST and extracts all Symbol nodes
 * @param content Template string to parse
 * @param ignoreGlobals Whether to ignore global variables
 * @returns Array of extracted variable names with detected types
 */
export const extractTemplateVariables = (
  content: string,
): { variables: ParsedVariable[]; error?: Error } => {
  try {
    // Parse the template
    // @ts-ignore - parser exists but is not in type definitions
    const ast = transform(nunjucks.parser.parse(content));

    // Use a map to store ParsedVariable objects, allowing for nested structures
    const variableMap = new Map<string, ParsedVariable>();
    const localVariables = new Set<string>();

    const getOrCreateVarByPath = (
      path: string[],
      finalTypeHint: 'STRING' | 'JSON' = 'STRING',
    ): ParsedVariable | null => {
      if (path.length === 0) return null;

      let currentLevelChildrenList: ParsedVariable[] | undefined = Array.from(variableMap.values());
      let currentParentMap = variableMap;
      let currentVar: ParsedVariable | undefined;

      for (let i = 0; i < path.length; i++) {
        const partName = path[i];
        const isLastPart = i === path.length - 1;

        if (i === 0) {
          // Top-level variable
          currentVar = currentParentMap.get(partName);
          if (!currentVar) {
            currentVar = {
              name: partName,
              type: isLastPart ? finalTypeHint : 'JSON',
              required: true,
              default_value: null,
            };
            currentParentMap.set(partName, currentVar);
          }
        } else {
          // Must have a currentVar from the previous iteration which is the parent
          if (!currentVar) return null; // Should not happen if logic is correct
          if (currentVar.type !== 'JSON') currentVar.type = 'JSON'; // Upgrade parent to JSON
          if (!currentVar.children) currentVar.children = [];

          let childVar = currentVar.children.find((c) => c.name === partName);
          if (!childVar) {
            childVar = {
              name: partName,
              type: isLastPart ? finalTypeHint : 'JSON',
              required: true,
              default_value: null,
            };
            currentVar.children.push(childVar);
          }
          currentVar = childVar;
        }

        // Ensure type is correctly JSON if it's not the last part, or if it was already JSON
        if (!isLastPart && currentVar.type !== 'JSON') {
          currentVar.type = 'JSON';
        }
        if (!currentVar.children && !isLastPart) {
          currentVar.children = [];
        }
      }
      return currentVar || null;
    };

    const walkAst = (
      node: any,
      currentActualCollection?: ParsedVariable,
      loopItemName?: string,
    ) => {
      if (!node) return;

      // console.log('Walking node:', node.typename, node.value || node.name?.value || '', 'LoopItemName:', loopItemName, 'CurrentColl:', currentActualCollection?.name);

      if (node.typename === 'Symbol') {
        const varName = node.value;
        if (!localVariables.has(varName)) {
          // If inside a loop and this symbol is the loop item itself (e.g. {{ item }}), it doesn't create a new var.
          if (!(loopItemName && varName === loopItemName)) {
            getOrCreateVarByPath([varName], 'STRING');
          }
        }
        return;
      }

      if (node.typename === 'LookupVal') {
        const path: string[] = [];
        let currentNode = node;
        while (currentNode && currentNode.typename === 'LookupVal') {
          if (currentNode.val && currentNode.val.typename === 'Literal') {
            path.unshift(currentNode.val.value);
          } else {
            if (currentNode.val) walkAst(currentNode.val, currentActualCollection, loopItemName);
            walkAst(currentNode.target, currentActualCollection, loopItemName);
            return;
          }
          currentNode = currentNode.target;
        }
        if (currentNode && currentNode.typename === 'Symbol') {
          // Do not add to path if it's a local variable (e.g. loop var) unless it's the start of the path.
          if (
            !localVariables.has(currentNode.value) ||
            (loopItemName && currentNode.value === loopItemName)
          ) {
            path.unshift(currentNode.value);
          }
        }

        if (path.length > 0) {
          // Check if this LookupVal is an access on the current loop item e.g. item.property
          if (
            currentActualCollection &&
            loopItemName &&
            path[0] === loopItemName &&
            path.length > 1
          ) {
            const propertyPathOnItem = path.slice(1); // e.g., ['property'] or ['obj', 'prop']
            let parentInCollection = currentActualCollection; // This is the actual collection variable like 'items'

            if (!parentInCollection.children) parentInCollection.children = [];

            for (let i = 0; i < propertyPathOnItem.length; i++) {
              const partName = propertyPathOnItem[i];
              const isLast = i === propertyPathOnItem.length - 1;

              if (!parentInCollection.children) parentInCollection.children = [];
              let child = parentInCollection.children.find((c) => c.name === partName);
              if (!child) {
                child = {
                  name: partName,
                  type: isLast ? 'STRING' : 'JSON',
                  required: true,
                  default_value: null,
                  children: isLast ? undefined : [],
                };
                if (!parentInCollection.children) parentInCollection.children = [];
                parentInCollection.children.push(child);
              }
              if (!isLast && child.type !== 'JSON') {
                child.type = 'JSON';
                if (!child.children) child.children = []; // Ensure children array for newly promoted JSON
              }
              parentInCollection = child;
            }
          } else if (!(loopItemName && path.length === 1 && path[0] === loopItemName)) {
            // Regular path, not on a loop item, or it IS the loop item itself (e.g. {{item}})
            // which shouldn't be processed by getOrCreateVarByPath if it's a local loop item.
            // Filter out paths that are just the loop variable itself if loopItemName is active.
            if (!localVariables.has(path[0])) {
              // Only process if base is not a known local variable
              getOrCreateVarByPath(path, 'STRING');
            }
          }
        }
        return;
      }

      if (node.typename === 'For') {
        let collectionVarForLoop: ParsedVariable | null = null;
        let collectionPath: string[] = [];

        if (node.arr) {
          if (node.arr.typename === 'Symbol') {
            collectionPath = [node.arr.value];
          } else if (node.arr.typename === 'LookupVal') {
            let currentArrNode = node.arr;
            while (currentArrNode && currentArrNode.typename === 'LookupVal') {
              if (currentArrNode.val && currentArrNode.val.typename === 'Literal') {
                collectionPath.unshift(currentArrNode.val.value);
              } else {
                collectionPath = [];
                break;
              } // Invalid path for collection
              currentArrNode = currentArrNode.target;
            }
            if (
              collectionPath.length > 0 &&
              currentArrNode &&
              currentArrNode.typename === 'Symbol'
            ) {
              collectionPath.unshift(currentArrNode.value);
            } else if (!(currentArrNode && currentArrNode.typename === 'Symbol')) {
              collectionPath = []; // Incomplete or non-symbol base for collection path
            }
          }

          if (collectionPath.length > 0 && !localVariables.has(collectionPath[0])) {
            collectionVarForLoop = getOrCreateVarByPath(collectionPath, 'JSON');
          } else if (collectionPath.length === 0 && node.arr) {
            // Collection is a complex expression, not a direct symbol or lookupval
            walkAst(node.arr, currentActualCollection, loopItemName);
          }
        }

        const currentLoopItemName = node.name?.value;
        if (currentLoopItemName) {
          localVariables.add(currentLoopItemName);
          // When walking the body, properties of currentLoopItemName should be added to collectionVarForLoop
          if (node.body) walkAst(node.body, collectionVarForLoop || undefined, currentLoopItemName);
          localVariables.delete(currentLoopItemName);
        }
        if (node.else_) walkAst(node.else_, currentActualCollection, loopItemName); // Else block uses outer context
        return;
      }

      // Generic traversal for other node types
      if (Array.isArray(node)) {
        node.forEach((child) => walkAst(child, currentActualCollection, loopItemName));
      } else if (typeof node === 'object') {
        for (const key in node) {
          if (Object.prototype.hasOwnProperty.call(node, key) && !key.startsWith('_')) {
            if (typeof node[key] === 'object' && node[key] !== null) {
              walkAst(node[key], currentActualCollection, loopItemName);
            }
          }
        }
      }
    };

    walkAst(ast);

    const extractedVariables = Array.from(variableMap.values());

    return { variables: extractedVariables };
  } catch (error) {
    return {
      variables: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
};

/**
 * Validates if a Nunjucks template is syntactically correct
 * Note: Currently not used in the application, but kept for potential future use
 */
export const validateTemplate = (content: string): { isValid: boolean; error?: string } => {
  try {
    transform(nunjucks.parser.parse(content));

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid template syntax',
    };
  }
};
