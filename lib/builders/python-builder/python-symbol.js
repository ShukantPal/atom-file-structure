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
  let type = "undefined";
  let object = "Node";
  let scope = "class";

  if (node.type == "VariableDeclarator" || node.type == "FunctionDeclaration") {
    name = node.id.name;
    type = getInitType(node.init);
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

// Helper to resolve the "type" of expression assigned to a variable/member
function getInitType(expression /*: MemberExpression */) {
  if (isClassExpression(expression)) {
    return "class";
  }
  if (isFunctionExpression(expression)) {
    return "function";
  }
  if (isObjectExpression(expression)) {
    return "object";
  }
  if (isLiteral(expression)) {
    if (isTemplateLiteral(expression)) {
      return "string";
    }
    // boolean | string | number
    return typeof expression.value;
  }

  return "Object";
}
