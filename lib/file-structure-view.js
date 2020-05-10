/** @babel */
/** @jsx etch.dom */
// @flow

import etch from 'etch'
import { getBuilder } from './builders'
// eslint-disable-next-line no-unused-vars
import { SymbolTreeView } from './symbol-tree-view'

/*::
declare var atom: any

import type { View } from 'etch'
*/

export default class FileStructureView {
  /*:: element: HTMLElement */
  /*:: text: ?string */
  /*:: refs: { fileScope: SymbolTreeView } */

  constructor () {
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
  }

  getElement () {
    return this.element
  }

  render () /*: View */ {
    return (
      <div className="file-structure">
        <SymbolTreeView ref="fileScope" />
      </div>
    )
  }

  update () /*: any */ {
    return etch.update(this, true)
  }
}
