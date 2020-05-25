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
          return filter(value, index) // Filter nodes
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

    function checkNested (obj /*, level1, level2, ... levelN */) {
      var args = Array.prototype.slice.call(arguments, 1)

      for (var i = 0; i < args.length; i++) {
        if (!obj || !obj.hasOwnProperty(args[i])) {
          return false
        }
        obj = obj[args[i]]
      }
      return true
    }

    function parseClassStack (node, ancestors) {
      let currentNode = fromPython(node) // Format node to CSymbol

      if (currentNode) {
        // Get ancestors to determine if the currentNode is a property or a method
        const relevantAncestors = getRelevantAncestors((value, index) => {
          return isProperty(value) || isMethod(value, index, ancestors)
        }, ancestors)

        let nearestAncestor = relevantAncestors[relevantAncestors.length - 1]

        if (nearestAncestor) {
          if (nearestAncestor.type == 'AssignmentExpression') {
            currentNode.type = 'function'
          }

          // Get cached node values from registry
          if (nearestAncestor.name in nodeList) {
            nearestAncestor = nodeList[nearestAncestor.name]
          }
          if (currentNode.name in nodeList) {
            currentNode = nodeList[nearestAncestor.name]
          }

          if (nearestAncestor.name !== currentNode.name) {
            // Nest the nodes and update the registry
            addNestedSymbol(currentNode, nearestAncestor)
            nodeList[nearestAncestor.name] = nearestAncestor
            nodeList[currentNode.name] = currentNode
          }
        }
      }
    }

    // Used to determine if a node is a method
    function isMethod (value, index, ancestors) {
      return (
        value.type == 'AssignmentExpression' &&
        checkNested(value, 'left', 'object', 'object', 'name') &&
        index == ancestors.length - 2
      )
    }

    // Used to determine if a node is a property
    function isProperty (value) {
      return value.type == 'FunctionDeclaration'
    }

    walk.ancestor(ast, {
      // Get all property and method nodes
      MemberExpression (node, ancestors) {
        parseClassStack(node, ancestors)
      },
      // Get all function nodes
      FunctionDeclaration (node, ancestors) {
        parseStack(
          value => {
            return value.type == 'FunctionDeclaration'
          },
          node,
          ancestors
        )
      },
      // Get all variable nodes
      VariableDeclarator (node, ancestors) {
        parseStack(
          value => {
            return (
              value.type == 'VariableDeclarator' ||
              value.type == 'FunctionDeclaration'
            )
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
