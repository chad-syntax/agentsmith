/**
MIT License

Copyright (c) 2024 carl chen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
// @ts-nocheck

/**
 * Capitalizes the first letter of a string.
 *
 * @param target - The string to be capitalized.
 * @return - The capitalized string.
 */
const capitalize = (target) => target.charAt(0).toUpperCase() + target.slice(1);

const _toString = Object.prototype.toString;
/**
 * Checks if the given value is an object.
 *
 * @param {unknown} val - The value to be checked.
 * @return {boolean} Returns true if the value is an object, otherwise false.
 */
function isObject(val) {
  return _toString.call(val) === '[object Object]';
}
/**
 * Checks if the given value is null.
 *
 * @param {unknown} val - The value to check.
 * @return {boolean} Returns true if the value is null, false otherwise.
 */
function isNull(val) {
  return val === null;
}

const isCycleDeps = Symbol('isCycleDeps');
const isCycleName = Symbol('isCycleName');

function parseValueMapTypeGroup(target) {
  const typeMap = {
    string: 0 /* TypeGroup.String */,
    undefined: 4 /* TypeGroup.Undefined */,
    number: 1 /* TypeGroup.Number */,
    boolean: 2 /* TypeGroup.Boolean */,
    object: 6 /* TypeGroup.Object */,
  };
  if (typeof target === 'string' && target.startsWith('__$$__')) {
    return 7 /* TypeGroup.Cycle */;
  }
  const targetType = typeof target;
  if (Array.isArray(target)) return 5 /* TypeGroup.Array */;
  if (isNull(target)) return 3 /* TypeGroup.Null */;
  return typeMap[targetType];
}
function mergeTreeType(currentType, typeStructTree) {
  return [...typeStructTree.type, currentType];
}
function recursiveChildrenGenerateType(target, field, typeStructTree, options) {
  const children = generatorTypeStructTree(target, field, typeStructTree.children, options);
  let existChildrenTarget = typeStructTree.children.get(field);
  if (!existChildrenTarget) {
    typeStructTree.children.set(field, children);
    existChildrenTarget = children;
  } else {
    existChildrenTarget.type = [...new Set([...children.type, ...existChildrenTarget.type])];
  }
  if (options && options.isArrayType) {
    let count = 0;
    if (!existChildrenTarget.__array_count) {
      existChildrenTarget.__array_keys_map = new Map();
    } else {
      count = existChildrenTarget.__array_keys_map.get(field);
    }
    count++;
    existChildrenTarget.__array_keys_map.set(field, count);
    existChildrenTarget.__array_count = options.length;
  }
}
function generatorTypeStructTree(target, field, parentTreeMap, options) {
  let typeStructTree = parentTreeMap?.get(field) ?? {
    type: [],
  };
  switch (parseValueMapTypeGroup(target)) {
    case 0 /* TypeGroup.String */:
      typeStructTree.type = mergeTreeType(0 /* TypeGroup.String */, typeStructTree);
      if (!typeStructTree.stringValues) {
        typeStructTree.stringValues = new Set();
      }
      typeStructTree.stringValues.add(target);
      break;
    case 1 /* TypeGroup.Number */:
      typeStructTree.type = mergeTreeType(1 /* TypeGroup.Number */, typeStructTree);
      break;
    case 2 /* TypeGroup.Boolean */:
      typeStructTree.type = mergeTreeType(2 /* TypeGroup.Boolean */, typeStructTree);
      if (!typeStructTree.booleanValues) {
        typeStructTree.booleanValues = new Set();
      }
      typeStructTree.booleanValues.add(target);
      break;
    case 7 /* TypeGroup.Cycle */:
      typeStructTree.type = mergeTreeType(7 /* TypeGroup.Cycle */, {
        type: [target.split('__$$__')[1]],
      });
      break;
    case 4 /* TypeGroup.Undefined */:
      typeStructTree.type = mergeTreeType(4 /* TypeGroup.Undefined */, typeStructTree);
      break;
    case 5 /* TypeGroup.Array */:
      if (!typeStructTree.children) {
        typeStructTree.children = new Map();
      }
      typeStructTree.type = mergeTreeType(5 /* TypeGroup.Array */, typeStructTree);
      const arrayChildrenField = `${String(field)}__$$children`;
      target.forEach((item, _, arr) => {
        recursiveChildrenGenerateType(item, arrayChildrenField, typeStructTree, {
          ...options,
          isArrayType: true,
          length: arr.length,
        });
      });
      break;
    case 6 /* TypeGroup.Object */:
      if (parentTreeMap && !parentTreeMap.get(field)) {
        parentTreeMap.set(field, typeStructTree);
      }
      if (!typeStructTree.children) {
        typeStructTree.children = new Map();
      }
      typeStructTree.type = mergeTreeType(6 /* TypeGroup.Object */, typeStructTree);
      Object.keys(target).forEach((key) => {
        recursiveChildrenGenerateType(target[key], key, typeStructTree, options);
      });
      break;
    default:
      typeStructTree.type = mergeTreeType(3 /* TypeGroup.Null */, typeStructTree);
  }
  return typeStructTree;
}
function generateSpace(space) {
  let ret = '';
  for (let i = 0; i < space; i++) {
    ret += '\t';
  }
  return ret;
}
function parserKey(key) {
  const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  if (validIdentifier.test(key)) return key;
  return `'${key}'`;
}
function generateParticleType(field, typeStructTree) {
  if (typeStructTree.__array_keys_map) {
    const count = typeStructTree.__array_keys_map.get(field);
    if (count < typeStructTree.__array_count) return '?';
  }
  return '';
}
function parseTypeStructTreeToTsType(typeStructTree, space = 1) {
  const valueList = typeStructTree.type.map((target, index) => {
    switch (target) {
      case 2 /* TypeGroup.Boolean */:
        return [...(typeStructTree.booleanValues || [])].map(String).join(' | ') || 'boolean';
      case 1 /* TypeGroup.Number */:
        return 'number';
      case 0 /* TypeGroup.String */:
        return (
          [...(typeStructTree.stringValues || [])].map((v) => `'${v}'`).join(' | ') || 'string'
        );
      case 4 /* TypeGroup.Undefined */:
        return 'undefined';
      case 7 /* TypeGroup.Cycle */:
        return '';
      case 6 /* TypeGroup.Object */:
        let val = '{';
        const childrenObjectSpace = space + 1;
        for (const [key, value] of typeStructTree.children) {
          val += `\n${generateSpace(space)}${parserKey(String(key))}${generateParticleType(key, value)}: ${parseTypeStructTreeToTsType(value, childrenObjectSpace)}`;
        }
        val += `\n${generateSpace(space - 1)}}`;
        return val;
      case 5 /* TypeGroup.Array */:
        const elementTree = typeStructTree.children.values().next().value;
        if (!elementTree) {
          return 'unknown[]';
        }

        const isOnlyStrings = elementTree.type.length === 1 && elementTree.type[0] === 0;
        if (isOnlyStrings && elementTree.stringValues) {
          const literals = [...elementTree.stringValues].map((v) => `'${v}'`);
          return `[${literals.join(', ')}]`;
        }

        const isOnlyBooleans = elementTree.type.length === 1 && elementTree.type[0] === 2;
        if (isOnlyBooleans && elementTree.booleanValues) {
          const literals = [...elementTree.booleanValues].map(String);
          return `[${literals.join(', ')}]`;
        }

        const elementTypeString = parseTypeStructTreeToTsType(elementTree, space + 1);
        return `Array<${elementTypeString}>`;
    }
    if (typeof target === 'string' && typeStructTree.type.length === 2) {
      return capitalize(typeStructTree.type[index] || '') || 'unknown';
    }
    return 'null';
  });
  return [...new Set(valueList)].filter(Boolean).join(' | ');
}
function deepCloneMarkCycleReference(key, target, stack = new Map()) {
  if (typeof target === 'object' && !isNull(target)) {
    if (stack.has(target)) {
      const cycleKey = stack.get(target);
      Reflect.set(target, isCycleDeps, true);
      Reflect.set(target, isCycleName, cycleKey);
      return '__$$__' + cycleKey;
    } else {
      stack.set(target, key);
    }
    if (Array.isArray(target)) {
      return target.map((r) => deepCloneMarkCycleReference(`${key}Child`, r, stack));
    } else if (isObject(target)) {
      return Object.keys(target).reduce((acc, targetKey) => {
        let value = target[targetKey];
        if (typeof value === 'object') {
          value = deepCloneMarkCycleReference(targetKey, value, stack);
        }
        acc[targetKey] = value;
        return acc;
      }, {});
    }
  }
  return target;
}

const version = '1.2.6';

function generateTypeDeclaration(target, options = {}) {
  const defaultOptions = {
    rootName: 'IRootName',
  };
  options = { ...defaultOptions, ...options };
  const stack = new Map();
  const isObj = typeof target === 'object' && target !== null;
  const cloneTarget = isObj ? deepCloneMarkCycleReference(options.rootName, target, stack) : target;
  const typeStructTree = generatorTypeStructTree(cloneTarget, options.rootName);
  let typeStr = '';
  if (isObj) {
    typeStr = [...stack.entries()]
      .filter(([_]) => {
        return _ && _ !== target && Reflect.get(_, isCycleDeps);
      })
      .map(([t]) => {
        const rootName = Reflect.get(t, isCycleName);
        if (!rootName) return '';
        return generateTypeDeclaration(t, {
          ...options,
          rootName,
        });
      })
      .join('\n');
    if (typeStr) typeStr += '\n';
  }
  const declareType = isObject(cloneTarget) ? 'interface' : 'type';
  return (
    `${typeStr}${declareType} ${options.rootName}${declareType === 'interface' ? '' : ' ='} ` +
    parseTypeStructTreeToTsType(typeStructTree)
  );
}

export { generateTypeDeclaration as default, version };
