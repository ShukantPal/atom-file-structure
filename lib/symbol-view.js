/** @babel */
/** @jsx etch.dom */
// @flow

import etch from 'etch'
import { ScopeView } from './scope-view'
import { SymbolViewRegistry } from './symbol-view-registry'

// Used for allocating viewID
let id = 0

/*::
import { type CSymbol } from './types'
import type { View } from 'etch'

declare var atom: any

type SymbolProps = {
  symbol: CSymbol,
  type?: string,
  depth?: number
}
 */

export class SymbolView extends ScopeView /*:: <SymbolProps> */ {
  /*:: props: SymbolProps */
  /*:: viewID: string */
  /*:: children: View[] */
  /*:: refs: { content: HTMLElement } */

  constructor (props /*: SymbolProps */) {
    super()

    this.props = Object.assign(props)
    this.viewID = `${id++}`

    etch.initialize(this)

    // Register this view-symbol mapping for global event handlers
    SymbolViewRegistry.registerSymbol(this.viewID, props.symbol)
  }

  onContentClicked (e /*: MouseEvent */) {
    // This event handler should only be called for this.refs.content
    if (e.currentTarget !== this.refs.content) {
      console.error('onclick event received by wrong handler!')
    }

    atom.workspace.getActiveTextEditor().scrollToBufferPosition(this.props.symbol.loc)
  }

  render () /*: View */ {
    const depth = this.props.depth || 0
    const type = this.props.type || this.props.symbol.type

    return (
      <div className="file-structure-symbol">
        <section id={this.viewID} ref="content" className="file-structure-symbol-content" on={{ click: this.onContentClicked }} >
          <span className="file-structure-symbol-text"
            style={{ paddingLeft: `${8 + depth * 20}px` }}>

            {type}: {this.props.symbol.name}
          </span>
        </section>
        <section className="file-structure-children-holder">
          {this.props.symbol.nested.map(childSymbol => (<SymbolView symbol={childSymbol} depth={depth + 1} />))}
        </section>
      </div>
    )
  }

  update (props /*: $Shape<SymbolProps> */, children /*:: ? : View[] */) {
    this.children = children || (this.children || [])

    if (props.symbol !== this.props.symbol) {
      Object.assign(this.props, props)
      etch.update(this, false)

      SymbolViewRegistry.registerSymbol(this.viewID, props.symbol)
    }
  }

  async destroy () {
    await super.destroy()
    SymbolViewRegistry.unregisterSymbol(this.viewID)
  }
}
