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

type SymbolState = {
  expanded: boolean
}
 */

export class SymbolView extends ScopeView /*:: <SymbolProps> */ {
  /*:: props: SymbolProps */
  /*:: viewID: string */
  /*:: children: View[] */
  /*:: refs: { content: HTMLElement } */

  /*:: state: SymbolState */

  constructor (props /*: SymbolProps */) {
    super()

    this.props = Object.assign(props)
    this.viewID = `${id++}`

    this.state = { expanded: false }

    etch.initialize(this)

    // Register this view-symbol mapping for global event handlers
    SymbolViewRegistry.registerSymbol(this.viewID, props.symbol)
  }

  toggleExpansion () {
    this.state.expanded = !this.state.expanded
    etch.update(this)
  }

  onContentClicked (e /*: MouseEvent */) {
    // This event handler should only be called for this.refs.content
    if (e.currentTarget !== this.refs.content) {
      console.error('onclick event received by wrong handler!')
      return
    }
    if (!this.state.expanded) {
      this.toggleExpansion()
    }

    atom.workspace.getActiveTextEditor().setCursorBufferPosition(this.props.symbol.loc)
    atom.workspace.getActiveTextEditor().scrollToCursorPosition({ center: true })
  }

  render () /*: View */ {
    const depth = this.props.depth || 0
    const type = this.props.type || this.props.symbol.type

    let icon = ''

    if (this.props.symbol.nested.length > 0) {
      if (this.state.expanded) {
        icon = 'icon-chevron-down'
      } else {
        icon = 'icon-chevron-right'
      }
    }

    return (
      <div className="file-structure-symbol">
        <section id={this.viewID} ref="content" className="file-structure-symbol-content">
          <section style={{ paddingLeft: `${4 + depth * 16}px` }}>
            <span style={{ paddingRight: icon ? '0px' : '21px' }}>
              <div class={`${icon ? 'icon' : ''} ${icon} expand-collapse`} on={{ click: this.toggleExpansion }}>
              </div>
            </span>
            <span className="file-structure-symbol-text" on={{ click: this.onContentClicked }}>
              {type || 'UndefinedType'}: {this.props.symbol.name || 'UndefinedName'}
            </span>
          </section>
        </section>
        <section className={`file-structure-children-holder ${this.state.expanded ? 'expanded' : 'collapsed'}`}>
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
