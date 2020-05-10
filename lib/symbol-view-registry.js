/** @babel */

export const SymbolViewRegistry = {
  registerSymbol (id, symbol) {
    this[id] = symbol
  },
  fetchSymbol (id) {
    return this[id]
  },
  unregisterSymbol (id) {
    delete this[id]
  }
}
