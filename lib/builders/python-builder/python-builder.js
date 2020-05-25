/** @babel */
// @flow

import { parse } from "filbert";
import { fromPython } from "./python-symbol";
const walk = require("acorn-walk");
import {
  addNestedSymbol,
  removeNestedSymbol,
  searchSymbol,
  traverseSymbol,
  treeToRoot,
} from "../../types";

function getRelevantAncestors(filterString, ancestors) {
  return ancestors
    .slice(0, -1)
    .filter((value, index) => {
      return value.type == filterString;
    })
    .map((value, index) => {
      return fromPython(value);
    });
}

export const PythonBuilder = {
  // Parse code into AST
  buildSymbolTree(code /*: string */) {
    return parse(code);
  },

  buildView(rootView /*: any */, ast /*: any */) {
    let nodeList = {};
    let roots = [];

    walk.ancestor(ast, {
      // Call on all function declarations
      FunctionDeclaration(node, ancestors) {
        let currentNode = fromPython(node); // Format node to CSymbol

        if (currentNode) {
          // Get all function declaration ancestors
          let relevantAncestors = getRelevantAncestors(
            "FunctionDeclaration",
            ancestors
          );
          let nearestAncestor = relevantAncestors[relevantAncestors.length - 1];

          if (nearestAncestor) {
            // If nearestAncestor has been computed, load the existing object
            if (nearestAncestor.name in nodeList) {
              nearestAncestor = nodeList[nearestAncestor.name];
            }
            /*
            If currentNode has been computed, load the existing object,
            else add it to the registry
            */

            if (currentNode.name in nodeList) {
              currentNode = nodeList[currentNode.name];
            } else {
              nodeList[currentNode.name] = currentNode;
            }
            // Configure nesting properties
            addNestedSymbol(currentNode, nearestAncestor);
            // Add the updated object to the registry
            nodeList[nearestAncestor.name] = nearestAncestor;
          } else {
            // Add the parent nodes to the registry if they don't exist
            if (!(currentNode.name in nodeList)) {
              nodeList[currentNode.name] = currentNode;
            }
            roots.push(currentNode.name); // Used for determining duplicates
          }
        }
      },
    });

    // Remove duplicates
    for (key in nodeList) {
      if (!roots.includes(nodeList[key].name)) {
        delete nodeList[key];
      }
    }

    // Format nodeArray
    let nodeArray = Object.values(nodeList);

    // Update tree
    rootView.update({ symbols: nodeArray });
  },

  test(ext /*: string */, file /*: string */) /*: boolean */ {
    return ext === "py";
  },
};
