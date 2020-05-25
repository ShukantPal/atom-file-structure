/** @babel */

import { isClass, isFunction, isMethod } from "../../types";

import {
  isDeclaration,
  isExpressionStatement,
  isThisExpression,
  isMemberExpression,
  isVariableDeclarator,
  isClassDeclaration,
  isClassExpression,
  isLiteral,
  isFunctionExpression,
  isFunctionDeclaration,
  isProperty,
  isClassProperty,
  isObjectExpression,
  isObjectMethod,
  isClassMethod,
  isTemplateLiteral,
  isFunction as isBabelFunction,
} from "@babel/types";

export function fromPython(
  nodePath /*: NodePath */,
  options /*: any */
) /*: ?PythonSymbol */ {
  const node = nodePath;
  let name = "undefined";
  let type = "function";
  let object = "Node";
  let scope = "class";

  if (node.type == "FunctionDeclaration") {
    name = node.id.name;
    type = "function";
  } else if (node.type == "VariableDeclarator") {
    name = node.id.name;
    type = node.init.value === undefined ? "object" : typeof node.init.value;
  } else return;

  return Object.assign({}, options, {
    name,
    longname: "",
    object,
    type,
    scope,
    nested: [],
    nestLookup: {},
    loc: {
      row: 0,
      column: 0,
    },
  });
}
