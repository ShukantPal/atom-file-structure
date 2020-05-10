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
import { addNestedSymbol, removeNestedSymbol, searchSymbol, traverseSymbol, treeToRoot } from '../../types'

/*::
import type { BabelSymbol, BabelSymbolTree } from './babel-symbol'
import type { NodePath } from '@babel/traverse'
import type { Node, SourceLocation } from '@babel/types';
import type { Builder } from '../builder'
import type { CSymbolLoc, CSymbolParent, CSymbolTree } from '../../types'

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
        addNestedSymbol(symbol, scope)
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

    console.log(symbolSurface)

    const tree = resolveTree(symbolSurface)

    console.log(tree)

    rootView.update(tree)
  },

  test (ext /*: string */, file /*: string */) /*: boolean */ {
    return (ext === 'js' || ext === 'jsx')
  }
}

// ------------------------------------------------------------------------------------------------
// Tree Normalization Functions
// ------------------------------------------------------------------------------------------------

// Generates a normalized BabelSymbolTree
// + it also resolves parent references
// + it also resolves all the longnames
// + it also resolves this.classProperty and Object.property symbols to their true parents
function resolveTree (symbols /*: BabelSymbol[] */) /*: BabelSymbolTree */ {
  for (let i = 0; i < symbols.length; i++) {
    resolveLongnamesAndParents(symbols[i])
  }

  const tree /*: BabelSymbolTree */ = { symbols }

  const parentResolveQueue /*: BabelSymbol[] */ = []

  // traverseSymbol always touches the shallow nodes (i.e. symbols with least no. of ancestor symbols)
  // first. Hence, any dependencies should always be resolved beforehand. For example, in this snippet:
  //
  //     GlobalObject.Property.NestedProperty = 'value';
  //     GlobalObject.Property = {};
  //     GlobalObject = {};
  //
  // the symbol "NestedProperty"'s parent "Property" symbol **will** be resolved first. This allows us
  // to make the assumption that if no parent is found, then we can assume it is an (external) object.
  traverseSymbol(tree, (symbol) => {
    if (resolveDidAssign(symbol)) {
      parentResolveQueue.push((symbol /*: any */))
    }
  })

  for (let i = 0; i < parentResolveQueue.length; i++) {
    const symbol = parentResolveQueue[i]
    const codedParent = symbol.parent

    // Orphan this symbol for replacement
    if (symbol.parent) {
      removeNestedSymbol(symbol)
    } else {
      tree.symbols.splice(tree.symbols.indexOf(symbol), 1)
    }

    const object /*: string */ = (symbol.object /*: any */)

    // "this" is handled specially
    if (object === 'this') {
      const scope = resolveThis(symbol, tree)

      console.log(scope)
      console.log(symbol)
      console.log('&&&&')

      if (scope) {
        addNestedSymbol(symbol, scope)
      } else {
        // Top-level assignment

        tree.symbols.push(symbol)
      }

      continue
    }

    const parentSymbol = searchSymbol(object, tree)

    if (parentSymbol) {
      addNestedSymbol(symbol, parentSymbol)
    } else {
      const newParent = resolveObject(object, tree, symbol.loc)

      if (newParent) {
        addNestedSymbol(symbol, newParent)
      } else if (codedParent) { // revert
        addNestedSymbol(symbol, codedParent)
      } else {
        tree.symbols.push(symbol)
      }
    }
  }

  return tree
}

// Sets the symbol longnames and parent references
function resolveLongnamesAndParents (symbol /*: BabelSymbol */, prefix = '', parent /*:: ? : BabelSymbol */) {
  symbol.longname = `${prefix}${prefix ? '.' : ''}${symbol.name}`
  symbol.parent = parent

  for (let i = 0; i < symbol.nested.length; i++) {
    resolveLongnamesAndParents(symbol.nested[i], symbol.longname, symbol)
  }
}

// Resolves the symbol prefix (such that longname = [prefix].[name]) using the chain of parent references
// eslint-disable-next-line no-unused-vars
function resolvePrefix (symbol /*: BabelSymbol */) /*: string */ {
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

// If a symbol's object doesn't exist, this is used to create one with type "object"
function resolveObject (
  longname /*: string | string[] */,
  symbol /*: { symbols: BabelSymbol[] } | BabelSymbol */,
  defaultLoc /*: CSymbolLoc */
) /*: BabelSymbol */ {
  if (typeof longname === 'string') {
    longname = longname.split('.')
  }

  let tree = null

  if (symbol.symbols) {
    tree = symbol
    symbol = treeToRoot(tree)
  }

  const name = longname[0]

  if (symbol.nestLookup[name]) {
    if (longname.length === 0) {
      return symbol.nestLookup[name]
    }

    return resolveObject(longname.slice(1), symbol.nestLookup[name], defaultLoc)
  }

  let i = 0
  let currentParent /*: BabelSymbol */ = symbol // $FlowFixMe
  let currentLongname = ''

  // If passed "symbol" was actually a symbol-tree, then we append an object to the tree's top-level
  // symbols instead of the temporary root-symbol.
  if (tree) {
    const objectSymbol = {
      type: 'object',
      name: longname[0],
      longname: longname[0],
      nested: [],
      nestLookup: {},
      parent: null,
      tags: [],
      loc: defaultLoc,
      id: ''
    }

    tree.symbols.push(objectSymbol)

    ++i
    currentParent = objectSymbol
    currentLongname = longname[0]
  }

  for (; i < longname.length; i++) {
    const nextLongname = `${currentLongname}.${longname[i]}`
    const nextParent /*: BabelSymbol */ = (addNestedSymbol(currentParent, {
      type: 'object',
      name: longname[i],
      longname: nextLongname,
      nested: [],
      nestLookup: {},
      tags: [],
      loc: defaultLoc,
      id: ''
    }) /*: any */)

    currentParent = nextParent
    currentLongname = nextLongname
  }

  return currentParent
}

// Finds the "this" context for the symbol
function resolveThis (refereeSymbol /*: BabelSymbol */, tree /*: CSymbolTree */) /*: BabelSymbol */ {
  let parent = refereeSymbol.parent
  const realParent = parent

  while (parent) {
    if (parent.type === 'class') {
      return parent
    }
    if (realParent.type === 'method' && parent.type === 'object') {
      return parent
    }

    parent = parent.parent
  }

  return realParent
}
