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

const DISALLOWED_IDENTIFIERS = [
  'process',
  'require',
  'eval',
  'Function',
  'this',
  'window',
  'document',
  'self',
  'globalThis',
  'constructor',
  'prototype',
  '__proto__',
];

const DISALLOWED_PROPERTY_LOOKUPS = ['__proto__', 'constructor', 'prototype'];

const ensureSecureAstRecursive = (node: any): void => {
  if (!node) return;

  if (Array.isArray(node)) {
    node.forEach(ensureSecureAstRecursive);
    return;
  }

  switch (node.typename) {
    case 'Symbol':
      if (DISALLOWED_IDENTIFIERS.includes(node.value)) {
        throw new Error(`Security: Disallowed identifier '${node.value}' found.`);
      }
      break;
    case 'LookupVal':
      if (
        node.val &&
        node.val.typename === 'Literal' &&
        typeof node.val.value === 'string' &&
        DISALLOWED_PROPERTY_LOOKUPS.includes(node.val.value)
      ) {
        throw new Error(`Security: Disallowed property lookup '${node.val.value}' found.`);
      }
      ensureSecureAstRecursive(node.target);
      ensureSecureAstRecursive(node.val);
      break;
    default:
      if (typeof node === 'object') {
        for (const key in node) {
          if (
            Object.prototype.hasOwnProperty.call(node, key) &&
            !key.startsWith('_') &&
            key !== 'parent'
          ) {
            ensureSecureAstRecursive(node[key]);
          }
        }
      }
      break;
  }
};

const ensureSecureAst = (content: string): void => {
  try {
    // @ts-ignore - parser exists but is not in type definitions
    const ast = nunjucks.parser.parse(content);
    ensureSecureAstRecursive(ast);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Security:')) {
      throw error; // Re-throw specific security errors
    }
    // For other parsing errors, wrap them if necessary or let them bubble up as Nunjucks errors.
    // For now, re-throwing to ensure `validateTemplate` can catch them as generic parsing issues if not security related.
    throw new Error(
      `Template parsing failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/**
 * Validates if a Nunjucks template is syntactically correct
 * Note: Currently not used in the application, but kept for potential future use
 */
export const validateTemplate = (content: string): { isValid: boolean; error?: string } => {
  try {
    // First, check basic Nunjucks syntax
    transform(nunjucks.parser.parse(content));
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid template syntax',
    };
  }

  try {
    // Then, perform our security AST check
    ensureSecureAst(content);
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Template violates security policy',
    };
  }

  return { isValid: true };
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

const uniqueValues = {
  'now()': () => new Date().toISOString(),
};

/**
 * Processes variables by replacing special unique value placeholders with their actual values.
 * This is used to handle dynamic values like timestamps (now()), UUIDs, etc. in prompt variables.
 * The function recursively processes nested objects and arrays to ensure all unique values
 * are properly replaced throughout the variable structure.
 *
 * @param variables - Object containing variables to process, including a 'global' property
 * @returns Processed variables with unique values replaced
 */
export const processUniqueValues = (
  variables: Record<string, any> & { global: Record<string, any> },
) => {
  const processValue = (value: any): any => {
    if (value in uniqueValues) {
      return uniqueValues[value as keyof typeof uniqueValues]();
    }
    if (Array.isArray(value)) {
      return value.map(processValue);
    }
    if (typeof value === 'object' && value !== null) {
      const newObj: Record<string, any> = {};
      for (const k in value) {
        if (Object.prototype.hasOwnProperty.call(value, k)) {
          newObj[k] = processValue(value[k]);
        }
      }
      return newObj;
    }
    return value;
  };

  const processedVariables = Object.entries(variables).reduce(
    (acc, [key, value]) => {
      acc[key] = processValue(value);
      return acc;
    },
    {} as Record<string, any>,
  );

  return processedVariables;
};

export const validateGlobalContext = (
  content: string,
  globalContext: Record<string, any>,
): { missingGlobalContext: string[] } => {
  const { variables, error } = extractTemplateVariables(content);

  if (error) {
    throw new Error('Error validating global context: ' + error.message);
  }

  const globalVariable = variables.find((v) => v.name === 'global');

  if (!globalVariable) {
    return { missingGlobalContext: [] };
  }

  const missingGlobalContext = findMissingGlobalContext({ globalVariable, globalContext });

  return { missingGlobalContext };
};

export const compilePrompt = (
  promptContent: string,
  variables: Record<string, any> & { global: Record<string, any> },
): string => {
  ensureSecureAst(promptContent); // Perform security check first
  const processedVariables = processUniqueValues(variables);
  nunjucks.configure({ autoescape: false });
  return nunjucks.renderString(promptContent, processedVariables);
};

export const validateVariables = (
  variables: ParsedVariable[],
  variablesToCheck: Record<string, string | number | boolean>,
): {
  missingRequiredVariables: ParsedVariable[];
  variablesWithDefaults: Record<string, string | number | boolean>;
} => {
  const missingRequiredVariables = variables
    .filter((v) => v.required)
    .filter((v) => !(v.name in variablesToCheck));

  const defaultValues = variables.reduce(
    (acc, v) => (v.default_value ? { ...acc, [v.name]: v.default_value } : acc),
    {},
  );

  const variablesWithDefaults = {
    ...defaultValues,
    ...variablesToCheck,
  };

  return { missingRequiredVariables, variablesWithDefaults };
};
