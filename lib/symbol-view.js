/** @babel */
/** @jsx etch.dom */
// @flow

import etch from 'etch'
import { ScopeView } from './scope-view'
import { SymbolViewRegistry } from './symbol-view-registry'

/* eslint-disable no-unused-vars */
import IcLightClass from './icons/light/icon-class'
import IcLightConstant from './icons/light/icon-constant'
import IcLightFunction from './icons/light/icon-function'
import IcLightInterface from './icons/light/icon-interface'
import IcLightModule from './icons/light/icon-module'
import IcLightProperty from './icons/light/icon-property'
import IcLightVariable from './icons/light/icon-variable'
/* eslint-enable no-unused-vars */

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
  /*:: refs: { content: HTMLElement, text: HTMLElement } */

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
    if (e.currentTarget !== this.refs.text) {
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
    const symbol = this.props.symbol

    let icon = ''
    let iconView = false

    if (type === 'class') {
      iconView = <IcLightClass />
    } else if (type === 'function' || type === 'method') {
      iconView = <IcLightFunction />
    } else if (symbol.scope === 'let' || symbol.scope === 'var') {
      iconView = <IcLightVariable />
    } else if (symbol.scope === 'const') {
      iconView = <IcLightConstant />
    }

    if (!iconView && this.props.symbol.nested.length > 0) {
      if (this.state.expanded) {
        icon = 'icon-chevron-down'
      } else {
        icon = 'icon-chevron-right'
      }
    }

    let padding = '0px'

    if (iconView) {
      padding = '2px'
    } else if (!icon) {
      padding = '22px'
    }

    if (iconView) {
      iconView = <div style={{ paddingRight: padding, display: 'inline-block' }} on={{ click: this.toggleExpansion }}>
        {iconView}
      </div>
    }

    return (
      <div className="file-structure-symbol">
        <section id={this.viewID} ref="content" className="file-structure-symbol-content">
          <section style={{ paddingLeft: `${4 + depth * 16 + ((iconView || icon) ? 0 : 22)}px` }}>
            {
              iconView ||
              <div class={`${icon ? 'icon' : ''} ${icon} expand-collapse`} style={{ paddingRight: '0px' }} on={{ click: this.toggleExpansion }}>
              </div>
            }
            <span ref="text" className="file-structure-symbol-text" on={{ click: this.onContentClicked }}>
              {type || 'UndefinedType'}: {this.props.symbol.name || 'UndefinedName'}
            </span>
          </section>
        </section>
        <section className={`file-structure-children-holder ${this.state.expanded ? 'file-structure-expanded' : 'file-structure-collapsed'}`}>
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
