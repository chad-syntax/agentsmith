// @ts-ignore - nunjucks doesn't export these types properly
import nunjucks from 'nunjucks/browser/nunjucks';
import { Database } from '@/app/__generated__/supabase.types';
// @ts-ignore - nunjucks doesn't export these types properly
import { transform } from 'nunjucks/src/transformer';

export type ParsedVariable = {
  id?: number;
  name: string;
  type: Database['public']['Enums']['variable_type'];
  required: boolean;
  default_value: string | null;
  children?: ParsedVariable[];
};

/**
 * Top-level factory for a ParsedVariable with default flags.
 */
const createParsedVariable = (
  name: string,
  type: Database['public']['Enums']['variable_type'],
): ParsedVariable => ({
  name,
  type,
  required: true,
  default_value: null,
});

class TemplateVariablesExtractor {
  private variableMap = new Map<string, ParsedVariable>();
  private localVariables = new Set<string>();

  /* ---------- Utilities ---------- */
  private ensureVariablePath(
    path: string[],
    finalType: Database['public']['Enums']['variable_type'] = 'STRING',
  ): ParsedVariable | null {
    if (path.length === 0) return null;

    let current: ParsedVariable | undefined = this.variableMap.get(path[0]);
    if (!current) {
      current = createParsedVariable(path[0], path.length === 1 ? finalType : 'JSON');
      this.variableMap.set(path[0], current);
    }

    for (let i = 1; i < path.length; i++) {
      if (!current) return null; // TS guard

      const segment = path[i];
      const isLast = i === path.length - 1;

      if (current.type !== 'JSON') current.type = 'JSON';
      if (!current.children) current.children = [];

      let child: ParsedVariable | undefined = current.children.find((c) => c.name === segment);
      if (!child) {
        child = createParsedVariable(segment, isLast ? finalType : 'JSON');
        current.children.push(child);
      }

      current = child;
    }

    if (current) {
      // Only upgrade to JSON, never downgrade from JSON to STRING
      if (current.type === 'STRING' && finalType === 'JSON') {
        current.type = 'JSON';
      }
    }

    return current ?? null;
  }

  private ensurePathOnVariable(
    root: ParsedVariable,
    path: string[],
    finalType: Database['public']['Enums']['variable_type'] = 'STRING',
  ): void {
    let current = root;
    for (let i = 0; i < path.length; i++) {
      const segment = path[i];
      const isLast = i === path.length - 1;

      if (current.type !== 'JSON') current.type = 'JSON';
      if (!current.children) current.children = [];

      let child: ParsedVariable | undefined = current.children.find((c) => c.name === segment);
      if (!child) {
        child = createParsedVariable(segment, isLast ? finalType : 'JSON');
        current.children.push(child);
      }

      current = child;
    }
  }

  private literalPathFromLookup(lookup: any): string[] | null {
    const path: string[] = [];
    let node: any = lookup;

    while (node && node.typename === 'LookupVal') {
      if (node.val && node.val.typename === 'Literal') {
        path.unshift(node.val.value);
        node = node.target;
      } else {
        return null; // dynamic property access – unsupported
      }
    }

    if (node && node.typename === 'Symbol') {
      path.unshift(node.value);
      return path;
    }

    return null;
  }

  /* ---------- Traversal ---------- */
  private traverseNode(
    node: any,
    ctx: { currentCollection?: ParsedVariable; loopItemName?: string } = {},
  ): void {
    if (!node) return;

    switch (node.typename) {
      case 'Symbol': {
        const varName = node.value;
        if (!this.localVariables.has(varName) && varName !== ctx.loopItemName) {
          this.ensureVariablePath([varName]);
        }
        break;
      }

      case 'LookupVal': {
        const path = this.literalPathFromLookup(node);
        if (!path) {
          this.traverseNode(node.val, ctx);
          this.traverseNode(node.target, ctx);
          break;
        }

        if (
          ctx.currentCollection &&
          ctx.loopItemName &&
          path[0] === ctx.loopItemName &&
          path.length > 1
        ) {
          this.ensurePathOnVariable(ctx.currentCollection, path.slice(1));
        } else if (!(ctx.loopItemName && path.length === 1 && path[0] === ctx.loopItemName)) {
          if (!this.localVariables.has(path[0])) {
            this.ensureVariablePath(path);
          }
        }
        break;
      }

      case 'For': {
        let collectionPath: string[] | null = null;
        if (node.arr?.typename === 'Symbol') {
          collectionPath = [node.arr.value];
        } else if (node.arr?.typename === 'LookupVal') {
          collectionPath = this.literalPathFromLookup(node.arr);
        }

        let collectionVar: ParsedVariable | undefined;
        if (collectionPath && !this.localVariables.has(collectionPath[0])) {
          collectionVar = this.ensureVariablePath(collectionPath, 'JSON') ?? undefined;
        } else if (!collectionPath) {
          this.traverseNode(node.arr, ctx);
        }

        const loopItemName = node.name?.value;
        if (loopItemName) {
          this.localVariables.add(loopItemName);
          if (node.body)
            this.traverseNode(node.body, { currentCollection: collectionVar, loopItemName });
          this.localVariables.delete(loopItemName);
        }

        if (node.else_) this.traverseNode(node.else_, ctx);
        break;
      }

      default: {
        if (Array.isArray(node)) {
          node.forEach((child) => this.traverseNode(child, ctx));
          return;
        }

        if (typeof node === 'object') {
          for (const key in node) {
            if (Object.prototype.hasOwnProperty.call(node, key) && !key.startsWith('_')) {
              this.traverseNode(node[key], ctx);
            }
          }
        }
      }
    }
  }

  /* ---------- Public API ---------- */
  public extractVariables(ast: any): ParsedVariable[] {
    this.traverseNode(ast);
    return Array.from(this.variableMap.values());
  }
}

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
    // Parse the template and build variables using the extractor class
    // @ts-ignore - parser exists but is not in type definitions
    const ast = transform(nunjucks.parser.parse(content));

    const extractor = new TemplateVariablesExtractor();
    const variables = extractor.extractVariables(ast);

    return { variables };
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

type FindMissingGlobalContextOptions = {
  globalVariable: ParsedVariable;
  globalContext: any;
};

export const findMissingGlobalContext = (options: FindMissingGlobalContextOptions): string[] => {
  const { globalVariable, globalContext } = options;

  const missingGlobalContext: string[] = [];

  if (globalVariable && globalVariable.children && globalVariable.children.length > 0) {
    for (const expectedVar of globalVariable.children) {
      const keyName = expectedVar.name;
      const fullKeyPath = `global.${keyName}`;

      if (!(keyName in (globalContext as any))) {
        missingGlobalContext.push(fullKeyPath);
      } else {
        const value = (globalContext as any)[keyName];
        if (value === null || value === undefined || String(value).trim() === '') {
          missingGlobalContext.push(fullKeyPath);
        }
      }
    }
  }

  return missingGlobalContext;
};
