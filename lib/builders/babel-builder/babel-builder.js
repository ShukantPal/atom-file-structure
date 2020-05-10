/** @babel */
// @flow

import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import {
  isProgram,
  isVariableDeclaration,
  isImportDeclaration,
  isExportDeclaration,
  isExpression,
  isBlockStatement,
  isClassBody
} from '@babel/types'
import { fromBabel } from './babel-symbol'
import { searchSymbol, traverseSymbol } from '../../types'

/*::
import type { BabelSymbol, BabelSymbolTree } from './babel-symbol'
import type { NodePath } from '@babel/traverse'
import type { Node, SourceLocation } from '@babel/types';
import type { Builder } from '../builder'

// This is used by BabelBuilder.buildSymbolTree to maintain AST-SymbolTree relations until the
// symbol-tree  is fully formed.
type LinkedBabelSymbol = {
  ...BabelSymbol,
  node: Node
}
 */

const BASE_OPTS = {
  allowImportExportEverywhere: true,
  allowAwaitOutsideFunction: true,
  allowReturnOutsideFunction: true,
  allowSuperOutsideMethod: true,
  allowUndeclaredExports: true,
  createParenthesizedExpression: false,
  errorRecovery: true,
  plugins: [
    'classProperties',
    'jsx',
    'flow'
  ]
}

// BabelBuilder uses @babel/* to parse and transform .js/.jsx files. It also supports Flow.
export const BabelBuilder /*: Builder<any> */ = {
  // buildSymbolTree in BabelBuilder is a dummy. It just returns the AST. This will be fixed
  // when atom-ast-service is released (that will be a service that provides ASTs)
  buildSymbolTree (code /*: string */) {
    return parse(code, BASE_OPTS)
  },

  buildView (rootView /*: any */, ast /*: any */) {
    const scopeStack /*: LinkedBabelSymbol[] */ = []
    const symbolSurface /*: BabelSymbol[] */ = []

    /* Helper methods to enter/exit out parent symbols */
    function enterSymbol (symbol) {
      const scope = scopeStack[scopeStack.length - 1]

      if (scope) {
        scope.nested.push(symbol)
      } else {
        symbolSurface.push(symbol)
      }

      scopeStack.push(symbol)
    }
    function exitSymbol () {
      const currentScope = scopeStack.pop()

      delete currentScope.node
    }

    traverse(ast, {
      enter: (nodePath /*: NodePath */) => {
        const maybeSymbol = fromBabel(nodePath)

        if (maybeSymbol) {
          maybeSymbol.node = nodePath.node
          enterSymbol(maybeSymbol)
        } else if (!isProgram(nodePath.node) && !isVariableDeclaration(nodePath.node) &&
            !isImportDeclaration(nodePath.node) &&
            !isExportDeclaration(nodePath.node) &&
            !isExpression(nodePath.node) &&
            !isBlockStatement(nodePath.node) &&
            !isClassBody(nodePath.node)) {
          // Don't parse things we don't know
          // console.log(nodePath.node)
          nodePath.skip()
        }
      },
      exit: (nodePath /*: NodePath */) => {
        const currentScope = scopeStack[scopeStack.length - 1]

        if (currentScope && nodePath.node === currentScope.node) {
          exitSymbol()
        }
      }
    })

    rootView.update({ symbols: symbolSurface })
  },

  test (ext /*: string */, file /*: string */) /*: boolean */ {
    return (ext === 'js' || ext === 'jsx')
  }
}

// ------------------------------------------------------------------------------------------------
// Tree Formalization Functions
// ------------------------------------------------------------------------------------------------

// Resolve tree generates a BabelSymbolTree
// + it also resolves parent references
// + it also resolves all the longnames
// + it also resolves this.classProperty and Object.property symbols to their true parents
function resolveTree (symbols /*: BabelSymbol[] */) /*: BabelSymbolTree */ {
  for (let i = 0; i < symbols.length; i++) {
    resolveLongnamesAndParents(symbols[i])
  }

  const tree /*: BabelSymbolTree */ = { symbols }

  const parentResolveQueue = []

  // traverseSymbol always touches the shallow nodes (i.e. symbols with least no. of ancestor symbols)
  // first. Hence, any dependencies should always be resolved beforehand. For example, in this snippet:
  //
  //     GlobalObject.Property.NestedProperty = 'value';
  //     GlobalObject.Property = {};
  //     GlobalObject = {};
  //
  // the symbol "NestedProperty"'s parent "Property" symbol **will** be resolved first. This allows us
  // to make the assumption that if no parent is found, then we can assume it is an object.
  traverseSymbol(tree, (symbol) => {
    if (resolveDidAssign(symbol)) {
      parentResolveQueue.push(symbol)
    }
  })

  for (let i = 0; i < parentResolveQueue.length; i++) {
    const symbol = parentResolveQueue[i]

    // Orphan this symbol for replacement
    if (symbol.parent) {
      symbol.parent.nested.splice(symbol.parent.nested.indexOf(symbol), 1)
      symbol.parent = null
    }

    const parentSymbol = searchSymbol(symbol.object)

    if (parentSymbol) {
      parentSymbol.nested.push(symbol)
      symbol.parent = parentSymbol
    } else {

    }
  }
}

// Sets the symbol longnames and parent references
function resolveLongnamesAndParents (symbol /*: BabelSymbol */, prefix = '', parent /*:: ? : BabelSymbol */) {
  symbol.longname = `${prefix}.${symbol.name}`
  symbol.parent = parent

  for (let i = 0; i < symbol.nested.length; i++) {
    resolveLongnames(symbol.nested[i], symbol.longname, symbol)
  }
}

// Resolves the symbol prefix (such that longname = [prefix].[name]) using the chain of parent references
function resolvePrefix (symbol /*: BabelSymbol */) {
  let prefix = ''

  while (symbol.parent) {
    symbol = symbol.parent
    prefix += `${(symbol.parent ? '.' : '')}${symbol.name}`
  }

  return prefix
}

// Finds whether the symbol is "assigned" AND if is misplaced (the parent is wrong)
function resolveDidAssign (symbol /*: BabelSymbol */) /*: boolean */ {
  return !!symbol.object
}
