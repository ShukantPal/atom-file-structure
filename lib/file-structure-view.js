/** @babel */
/** @jsx etch.dom */
// @flow

import etch from 'etch'
import { getBuilder } from './builders'
// eslint-disable-next-line no-unused-vars
import { SymbolTreeView } from './symbol-tree-view'
// $FlowFixMe
import { Disposable } from 'atom'

/*::
declare var atom: any

import type { View } from 'etch'

type FileStructureProps = {
  enabled: boolean;
}
*/

export default class FileStructureView {
  /*:: element: HTMLElement */
  /*:: text: ?string */
  /*:: refs: { fileScope: SymbolTreeView } */
  /*:: props: FileStructureProps */
  /*:: didDestroyListeners: Array<() => void> */

  constructor () {
    this.props = { enabled: true }
    this.didDestroyListeners = []

    etch.initialize(this)
  }

  async updateText (text /*: string */) /* Promise */ {
    if (this.text === text) {
      console.log('no update')
      return
    }

    const editor = atom.workspace.getActiveTextEditor()

    if (!editor) {
      this.text = ''
      this.refs.fileScope.update({ symbols: [], message: 'Editor not active' })
      return
    }

    const fileName = editor.getTitle()
    const fileNameSplit = fileName.split('.')
    const fileContents = editor.getText()

    const ext = fileName.toLowerCase() === 'untitled' ? '' : fileNameSplit[fileNameSplit.length - 1]
    const builder = getBuilder(ext || '', fileContents)

    if (!builder) {
      this.refs.fileScope.update({ symbols: [], message: 'File extension not supported' })
    } else {
      try {
        builder.buildView(this.refs.fileScope, builder.buildSymbolTree(text))
        this.refs.fileScope.update({ message: '' })
      } catch (e) {
        console.error(e)

        this.refs.fileScope.update({ symbols: [], message: 'File could not be parsed ' + e.toString() })
      }
    }

    this.text = text
    await this.update()
  }

  // Returns an object that can be retrieved when package is activated
  serialize () {}

  // Tear down any state and detach
  async destroy () {
    await etch.destroy(this)

    for (let i = 0; i < this.didDestroyListeners.length; i++) {
      this.didDestroyListeners[i]()
    }

    // Make sure we don't bother these callbacks again!
    this.didDestroyListeners = []
  }

  // Add listener to call when destroy() is invoked
  onDidDestroy (callback /*: () => void */) /*: Disposable */ {
    this.didDestroyListeners.push(callback)

    return new Disposable(() => {
      const index = this.didDestroyListeners.indexOf(callback)

      if (index >= 0) {
        this.didDestroyListeners.splice(index, 1)
      }
    })
  }

  // HTMLElement of this "item"
  getElement () {
    return this.element
  }

  // Title of this item
  getTitle () {
    return 'File Structure'
  }

  // Left/right docks are the places that make sense
  getAllowedLocations () {
    return ['left', 'right']
  }

  // Render virtual DOM using etch.dom JSX
  render () /*: View */ {
    return (
      <div className="file-structure" style={{ height: this.props.enabled ? '100%' : '0px' }}>
        <SymbolTreeView ref="fileScope" />
      </div>
    )
  }

  // Update enabled/disabled state
  update (props /*:: ? : $Shape<FileStructureProps> */) /*: any */ {
    if (props) {
      this.props.enabled = props.enabled
    }

    return etch.update(this, true)
  }
}
