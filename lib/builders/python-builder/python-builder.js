/** @babel */
// @flow

import { parse } from 'filbert'
import { fromPython } from './python-symbol'
import {
  addNestedSymbol,
  removeNestedSymbol,
  searchSymbol,
  traverseSymbol,
  treeToRoot
} from '../../types'
const walk = require('acorn-walk')

export const PythonBuilder = {
  // Parse code into AST
  buildSymbolTree (code /*: string */) {
    return parse(code)
  },

  buildView (rootView /*: any */, ast /*: any */) {
    const nodeList = {}
    const roots = []

    function getRelevantAncestors (filter, ancestors) {
      return ancestors
        .slice(0, -1) // Exclude current node
        .filter((value, index) => {
          return filter(value.type) // Filter nodes
        })
        .map((value, index) => {
          return fromPython(value) // Format nodes into CSymbol
        })
    }

    function parseStack (filter, node, ancestors) {
      let currentNode = fromPython(node) // Format node to CSymbol

      if (currentNode) {
        // Get all function declaration ancestors
        const relevantAncestors = getRelevantAncestors(filter, ancestors)
        let nearestAncestor = relevantAncestors[relevantAncestors.length - 1]

        if (nearestAncestor) {
          // If nearestAncestor has been computed, load the existing object
          if (nearestAncestor.name in nodeList) {
            nearestAncestor = nodeList[nearestAncestor.name]
          }
          /*
          If currentNode has been computed, load the existing object,
          else add it to the registry
          */

          if (currentNode.name in nodeList) {
            currentNode = nodeList[currentNode.name]
          } else {
            nodeList[currentNode.name] = currentNode
          }
          // Configure nesting properties
          addNestedSymbol(currentNode, nearestAncestor)
          // Add the updated object to the registry
          nodeList[nearestAncestor.name] = nearestAncestor
        } else {
          // Add the parent nodes to the registry if they don't exist
          if (!(currentNode.name in nodeList)) {
            nodeList[currentNode.name] = currentNode
          }
          roots.push(currentNode.name) // Used for determining duplicates
        }
      }
    }

    walk.ancestor(ast, {
      FunctionDeclaration (node, ancestors) {
        parseStack(
          type => {
            return type == 'FunctionDeclaration'
          },
          node,
          ancestors
        )
      },
      VariableDeclarator (node, ancestors) {
        parseStack(
          type => {
            return type == 'VariableDeclarator' || type == 'FunctionDeclaration'
          },
          node,
          ancestors
        )
      }
    })

    // Remove duplicates
    for (key in nodeList) {
      if (!roots.includes(nodeList[key].name)) {
        delete nodeList[key]
      }
    }

    // Format nodeArray
    const nodeArray = Object.values(nodeList)

    // Update tree
    rootView.update({ symbols: nodeArray })
  },

  test (ext /*: string */, file /*: string */) /*: boolean */ {
    return ext === 'py'
  }
}
