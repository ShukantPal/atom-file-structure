/** @babel */
// @flow

/*::
export type CSymbolLoc = {
  row: number,
  column: number
}

export type CSymbol = {
  type: string,
  name: string,
  longname: string,
  nested: Array<CSymbol>,
  nestLookup: { [id]: string },
  parent?: CSymbol,
  tags: string,
  id: string,
  loc: CSymbolLoc
}

export type CSymbolTree = {
  symbols: Array<CSymbol>
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
  if (symbol.symbols) {
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
export function traverseSymbol (symbol /*: { nested: CSymbol[] } | CSymbolTree */, callback /*: (symbol: CSymbol) => boolean */) {
  if (symbol.symbols) {
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
export function addNestedSymbol (symbol /*: CSymbol */, parent /*: CSymbol */) /*: CSymbol */ {
  if (parent.nestLookup[symbol.name]) {
    const index = parent.nested.findIndex(symbol => symbol.name)

    parent.nested[index].parent = null
    parent.nested[index] = symbol
  } else {
    parent.nestLookup[symbol.name] = symbol
    parent.nested.push(symbol)
  }

  symbol.parent = parent

  return symbol
}
