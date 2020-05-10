'use babel'

import FileStructureView from './file-structure-view'
import { CompositeDisposable } from 'atom'

export default {

  fileStructureView: null,
  modalPanel: null,
  subscriptions: null,

  fileStructureTile: null,

  on: false,

  consumeStatusBar (statusBar) {
    /*    const tileRoot = document.createElement('div')

    tileRoot.textContent = 'FS-Active'

    this.fileStructureTile = statusBar.addRightTile({
      item: tileRoot,
      priority: 100
  }) */
  },

  activate (state) {
    this.fileStructureView = new FileStructureView(state.fileStructureViewState)

    this.modalPanel = atom.workspace.addRightPanel({
      item: this.fileStructureView.getElement(),
      visible: false
    })

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable()

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'file-structure:toggle': () => this.toggle()
    }))

    this.subscriptions.add(atom.workspace.onDidChangeActiveTextEditor(() => {
      const activeTextEditor = atom.workspace.getActiveTextEditor()

      if (activeTextEditor) {
        this.fileStructureView.updateText(atom.workspace.getActiveTextEditor().getText())
      } else {
        this.fileStructureView.updateText('')
      }
    }))
  },

  deactivate () {
    this.modalPanel.destroy()
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
    console.log('FileStructure was toggled!')

    this.on = !this.on

    if (this.modalPanel.isVisible()) {
      this.modalPanel.hide()
    } else {
      const activeTextEditor = atom.workspace.getActiveTextEditor()

      if (activeTextEditor) {
        this.fileStructureView.updateText(atom.workspace.getActiveTextEditor().getText())
      } else {
        this.fileStructureView.updateText('')
      }

      this.modalPanel.show()
    }
  }

}
