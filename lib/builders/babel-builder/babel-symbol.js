/** @babel */

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
  isTemplateLiteral
} from '@babel/types'

import {
  isClass,
  isFunction,
  isMethod
} from '../../types'

/*::
import type { NodePath } from '@babel/traverse'
import type { MemberExpression } from '@babel/types'
import type { CSymbol } from '../../types'

export type BabelSymbol = {
  ...CSymbol,
  scope: 'instance' | 'static' | 'inner' | 'var' | 'let' | 'const',
  object?: 'this' | string,
  type: 'class' | 'function' | 'method' | 'object' | 'string' | 'number' | 'boolean' | 'any',
}
*/

// Transform Babel AST into BabelSymbolTree
export function fromBabel (nodePath /*: NodePath */, options /*: any */) /*: ?BabelSymbol */ {
  const node = nodePath.node

  let name = '(anonymous)' /*: string */
  let type = 'any' /*: string */
  let object /*: ?string */
  let scope = 'inner' /*: string */

  if (isDeclaration(node) || isVariableDeclarator(node)) {
    if (isVariableDeclarator(node)) {
      // Handle const/let/var variable declarations

      name = node.id.name
      scope = nodePath.parent.kind || 'inner'
      type = getInitType(node.init)
    } else if (isClassDeclaration(node)) {
      // Handle classes

      name = node.id.name
      scope = 'inner'
      type = 'class'
    } else if (isFunctionDeclaration(node)) {
      // Handle functions

      name = node.id.name
      scope = 'inner'
      type = 'function'
    } else {
      return
    }
  } else if (isExpressionStatement(node)) {
    // Handle this.instanceProperty & ClassName.staticProperty

    if (isMemberExpression(node.expression.left)) {
      if (isThisExpression(node.expression.left)) {
        object = 'this'
        scope = 'instance'
      } else {
        object = getExpressionObjectLongname(node.expression.left)
        scope = 'static'
      }

      name = node.expression.left.property.name

      type = getInitType(node.expression.right)
    } else {
      return
    }
  } else if (isClassProperty(node)) {
    // Handle class properties, i.e. classProperty = value

    name = node.key.name
    scope = 'instance'
    type = getInitType(node.value)
  } else if (isClassMethod(node)) {
    // Handle class methods

    name = node.key.name
    scope = 'instance'
    type = 'method'
  } else if (isProperty(node)) {
    // Handle object properties, i.e. property: value

    name = node.key.name
    scope = 'static'
    type = getInitType(node.value)
  } else if (isObjectMethod(node)) {
    // Handle object methods

    name = node.key.name
    scope = 'static'
    type = 'method'
  } else {
    return
  }

  return Object.assign({}, options, {
    name,
    longname: '',
    object,
    type,
    scope,
    nested: [],
    loc: {
      row: node.loc.start.line,
      column: node.loc.start.column
    }
  })
}

// ------------------------------------------------------------------------------------------------
// Helper functions for BabelSymbol
// ------------------------------------------------------------------------------------------------

export function isVariable (symbol /*: BabelSymbol */) /*: boolean */ {
  return symbol.scope === 'let' || symbol.scope === 'const' || symbol.scope === 'var'
}

export { isClass, isFunction, isMethod }

// ------------------------------------------------------------------------------------------------
// Helper functions for fromBabel()
// ------------------------------------------------------------------------------------------------

// Helper to resolve assignment to object chain, e.g. [Class.prototype].property
function getExpressionObjectLongname (expression /*: MemberExpression */) {
  let longname = ''

  do {
    longname = expression.property.name + '.' + longname
    expression = expression.object
  } while (expression.object)

  return longname
}

// Helper to resolve the "type" of expression assigned to a variable/member
function getInitType (expression /*: MemberExpression */) {
  if (isClassExpression(expression)) {
    return 'class'
  }
  if (isFunctionExpression(expression)) {
    return 'function'
  }
  if (isObjectExpression(expression)) {
    return 'object'
  }
  if (isLiteral(expression)) {
    if (isTemplateLiteral(expression)) {
      return 'string'
    }
    // boolean | string | number
    return typeof expression.value
  }

  return 'Object'
}
