/** @babel */
// @flow

/*::
export type CSymbolLoc = {
  row: number,
  column: number
}

export type CSymbolParent = {
  nested: Array<CSymbol>,
  nestLookup: { [id: string]: CSymbol }
}

export type CSymbol = {
  type: string,
  name: string,
  longname: string,
  nested: Array<CSymbol>,
  nestLookup: { [id: string]: CSymbol },
  parent?: ?CSymbol,
  tags: string[],
  id: string,
  loc: CSymbolLoc
}

export type CSymbolTree = {
  symbols: Array<CSymbol>
}

export type CSymbolData = {
  file: string,
  tree: CSymbolTree,
  list: CSymbol[],
  cursor: ?CSymbol
}
*/

export function isClass (symbol /*: CSymbol */) /*: boolean */ {
  return symbol.type === 'class'
}

export function isFunction (symbol /*: CSymbol */) /*: boolean */ {
  return symbol.type === 'function'
}

export function isMethod (symbol /*: CSymbol */) /*: boolean */ {
  return symbol.type === 'method'
}

export function isMember (symbol /*: CSymbol */) /*: boolean */ {
  return !!symbol.parent
}

// Find symbol in CSymbol subtree or CSymbolTree
export function searchSymbol (longname /*: string | string[] */, symbol /*: { nested: CSymbol[] } | CSymbolTree */) /*: ?CSymbol */ {
  if (symbol.symbols) { // $FlowFixMe
    symbol = { nested: symbol.symbols }
  }
  if (typeof longname === 'string') {
    longname = longname.split('.')
  }

  const scopeName = longname[0]

  for (let i = 0; i < symbol.nested.length; i++) {
    if (symbol.nested[i].name === scopeName) {
      if (longname.length <= 1) {
        return symbol.nested[i]
      } else {
        return searchSymbol(longname.slice(1), symbol.nested[i])
      }
    }
  }

  return null
}

// Shallow-depth-first traversal
export function traverseSymbol (symbol /*: { nested: CSymbol[] } | CSymbolTree */, callback /*: (symbol: $Shape<CSymbol>) => any */) {
  if (symbol.symbols) { // $FlowFixMe
    symbol = { nested: symbol.symbols }
  } else {
    callback(symbol)
  }

  for (let i = 0; i < symbol.nested.length; i++) {
    callback(symbol.nested[i])
  }

  for (let i = 0; i < symbol.nested.length; i++) {
    traverseSymbol(symbol.nested[i], callback)
  }
}

// Add nested symbol, updates nested array and nestedLookup record
export function addNestedSymbol (symbol /*: CSymbol */, parent /*: CSymbolParent */) /*: CSymbol */ {
  // Prevent SymbolView renders from stack-overflowing
  if (symbol === parent) {
    throw new Error('Cannot nest symbol in itself')
  }

  if (parent.nestLookup[symbol.name]) {
    const index = parent.nested.findIndex(symbol => symbol.name)

    if (index >= 0) {
      parent.nested[index].parent = undefined
      parent.nested[index] = symbol
    } else {
      parent.nested.push(symbol)
    }
  } else {
    parent.nested.push(symbol)
  }

  parent.nestLookup[symbol.name] = symbol
  symbol.parent = (parent /*: any */)

  return symbol
}

// Remove the nested symbol from its parent
export function removeNestedSymbol (symbol /*: CSymbol */) /*: ?CSymbol */ {
  if (!symbol.parent) {
    return null
  }

  const parent = symbol.parent

  if (parent.nestLookup[symbol.name]) {
    delete parent.nestLookup[symbol.name]

    const index = parent.nested.indexOf(symbol)

    if (index >= 0) {
      parent.nested.splice(index, 1)
    }
  }

  return parent
}

// Discover all symbols in a CSymbolTree
export function discoverSymbols (tree /*: CSymbolTree | CSymbol */, into /*: CSymbol[] */ = []) /*: CSymbol [] */ {
  if (tree.symbols) { // $FlowFixMe
    into.push(...tree.symbols) // $FlowFixMe

    // $FlowFixMe
    for (let i = 0; i < tree.symbols.length; i++) { // $FlowFixMe
      discoverSymbols(tree.symbols[i], into)
    }
  } else {
    into.push(...tree.nested)

    for (let i = 0; i < tree.nested.length; i++) {
      discoverSymbols(tree.nested[i], into)
    }
  }

  return into
}

// CSymbolTree -> CSymbolData
export function treeToData (file /*: string */, tree /*: CSymbolTree */) /*: CSymbolData */ {
  return {
    tree,
    list: discoverSymbols(tree),
    file,
    cursor: null
  }
}

// Create an artifical root symbol that nests all the top-level symbols in the tree
export function treeToRoot (tree /*: CSymbolTree */) /*: CSymbolParent */ {
  const nested = tree.symbols
  const nestLookup = {}

  for (let i = 0; i < nested.length; i++) {
    nestLookup[nested[i].name] = nested[i]
  }

  return { nested, nestLookup }
}
