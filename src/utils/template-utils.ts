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
};

/**
 * Walks through the Nunjucks AST and extracts all Symbol nodes
 * @param content Template string to parse
 * @returns Array of extracted variable names with detected types
 */
export const extractTemplateVariables = (
  content: string,
): { variables: ParsedVariable[]; error?: Error } => {
  try {
    // Parse the template
    // @ts-ignore - parser exists but is not in type definitions
    const ast = transform(nunjucks.parser.parse(content));

    // Map to track variables and their detected types
    const variableMap = new Map<string, Database['public']['Enums']['variable_type']>();

    // Set to track local variable names (like loop variables) that shouldn't be extracted
    const localVariables = new Set<string>();

    // Recursive function to walk the AST
    const walkAst = (node: any) => {
      // Handle For loops - mark the collection variable as JSON and track the loop variable name
      if (node && node.typename === 'For') {
        if (node.arr && node.arr.typename === 'Symbol') {
          variableMap.set(node.arr.value, 'JSON');
        }

        // Add the loop variable to localVariables to exclude it from extracted variables
        if (node.name && node.name.typename === 'Symbol') {
          localVariables.add(node.name.value);
        }

        // Continue walking all parts of the For node
        if (node.arr) walkAst(node.arr);
        if (node.body) walkAst(node.body);
        if (node.else_) walkAst(node.else_);
        return;
      }

      // Handle LookupVal nodes (e.g., foo.bar) - mark the base variable as JSON
      if (node && node.typename === 'LookupVal') {
        if (node.target && node.target.typename === 'Symbol') {
          // Only add if not a local variable
          if (!localVariables.has(node.target.value)) {
            variableMap.set(node.target.value, 'JSON');
          }
        }
        // Continue walking both target and val parts
        if (node.target) walkAst(node.target);
        if (node.val) walkAst(node.val);
        return;
      }

      // Handle Filter nodes - ignore filter names but process their arguments
      if (node && node.typename === 'Filter') {
        if (node.args) walkAst(node.args);
        if (node.target) walkAst(node.target);
        return;
      }

      // Handle normal Symbol nodes - only add if not a local variable and not already marked as JSON
      if (node && node.typename === 'Symbol') {
        // Skip local variables like loop variables
        if (!localVariables.has(node.value)) {
          // Only set to STRING if not already set to JSON
          if (!variableMap.has(node.value)) {
            variableMap.set(node.value, 'STRING');
          }
        }
      }

      // Handle arrays (like children)
      if (Array.isArray(node)) {
        node.forEach(walkAst);
        return;
      }

      // Handle objects - walk through all properties that could be nodes or arrays of nodes
      if (node && typeof node === 'object') {
        // Process common properties that might contain nodes
        ['children', 'body', 'cond', 'else_', 'target', 'val', 'arr', 'args'].forEach((prop) => {
          if (node[prop]) {
            walkAst(node[prop]);
          }
        });

        // Check for any other object properties that might be nodes
        Object.keys(node).forEach((key) => {
          const value = node[key];
          if (
            value &&
            typeof value === 'object' &&
            !['children', 'body', 'cond', 'else_', 'target', 'val', 'arr', 'args'].includes(key) &&
            !key.startsWith('_') // Skip internal properties
          ) {
            walkAst(value);
          }
        });
      }
    };

    // Start walking from the root
    walkAst(ast);

    // Convert to array of ParsedVariable objects
    const variables = Array.from(variableMap.entries()).map(([name, type]) => ({
      name,
      type,
      required: true, // Default to required
      default_value: null,
    }));

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
