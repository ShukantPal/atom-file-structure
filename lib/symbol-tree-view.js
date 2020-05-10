/** @babel */
/** @jsx etch.dom */
// @flow

import etch from 'etch'
import { ScopeView } from './scope-view'
// eslint-disable-next-line no-unused-vars
import { SymbolView } from './symbol-view'

/*::
import type { CSymbol } from './types'

type SymbolTreeProps = {
  symbols: CSymbol[],
  message: string
}
*/

export class SymbolTreeView extends ScopeView /*:: <SymbolTreeProps> */ {
  constructor (props /*: ?SymbolTreeProps */) {
    super()
    this.props = props || { symbols: [], message: '' }

    etch.initialize(this)
  }

  render () {
    return (
      <div className="file-structure-tree-container">
        <section className="file-structure-tree-header">
          <span>File Structure</span>
          {this.props.message ? <p style={{ paddingTop: '8px' }}>{this.props.message}</p> : []}
        </section>
        <section className="file-structure-children-holder">
          {this.props.symbols ? this.props.symbols.map(childSymbol => <SymbolView symbol={childSymbol} />) : []}
        </section>
      </div>
    )
  }
}
