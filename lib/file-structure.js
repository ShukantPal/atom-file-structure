/** @babel */
// @flow

import FileStructureView from './file-structure-view'
// $FlowFixMe
import { CompositeDisposable } from 'atom'

/*::
declare var atom: any
*/

export default {
  // NOTE: Never change this directly (a memory leak can occur due to didDestroy listener)
  _fileStructureView: null,

  get fileStructureView () {
    if (!this._fileStructureView) {
      this._fileStructureView = new FileStructureView()
      this._fileStructureView.onDidDestroy(() => { this._fileStructureView = null; this.on = false; this.openedOnce = false })

      // The new _fileStructureView hasn't been opened yet
      this.openedOnce = false
    }

    return this._fileStructureView
  },

  modalPanel: null,
  subscriptions: null,

  fileStructureTile: null,

  on: false,
  openedOnce: false,

  consumeStatusBar (statusBar /*: any */) {
    /*    const tileRoot = document.createElement('div')

    tileRoot.textContent = 'FS-Active'

    this.fileStructureTile = statusBar.addRightTile({
      item: tileRoot,
      priority: 100
  }) */
  },

  activate (state /*: any */) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable()

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'file-structure:toggle': () => this.toggle()
    }))

    this.subscriptions.add(atom.workspace.onDidChangeActiveTextEditor(() => {
      if (!this.on) {
        return
      }

      const activeTextEditor = atom.workspace.getActiveTextEditor()

      if (activeTextEditor) {
        this.fileStructureView.updateText(activeTextEditor.getText())
      } else {
        this.fileStructureView.updateText('')
      }
    }))

    this.on = false
    this.toggle()
  },

  deactivate () {
    console.log('here')
    atom.workspace.hide(this.fileStructureView)
    this.subscriptions.dispose()
    this.fileStructureView.destroy()

    if (this.fileStructureTile) {
      this.fileStructureTile.destroy()
      this.fileStructureTile = null
    }
  },

  serialize () {
    return {
      fileStructureViewState: this.fileStructureView.serialize()
    }
  },

  toggle () {
    let on = !this.on

    if (!this.openedOnce) {
      atom.workspace.open(this.fileStructureView, { location: 'left', split: 'down' })
      on = true // Force this to be on
      this.openedOnce = true
    }

    this.on = on

    if (on) {
      const activeTextEditor = atom.workspace.getActiveTextEditor()

      if (activeTextEditor) {
        this.fileStructureView.updateText(atom.workspace.getActiveTextEditor().getText())
      } else {
        this.fileStructureView.updateText('')
      }
    }
  }

}
