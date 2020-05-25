/** @babel */

export function fromPython (
  nodePath /*: NodePath */,
  options /*: any */
) /*: ?PythonSymbol */ {
  const node = nodePath
  let name = 'undefined'
  let type = 'function'
  const object = 'Node'
  const scope = 'class'

  if (node.type === 'FunctionDeclaration') {
    name = node.id.name
    type = 'function'
  } else if (node.type === 'VariableDeclarator') {
    name = node.id.name
    type = node.init.value === undefined ? 'object' : typeof node.init.value
  } else return

  return Object.assign({}, options, {
    name,
    longname: '',
    object,
    type,
    scope,
    nested: [],
    nestLookup: {},
    loc: {
      row: 0,
      column: 0
    }
  })
}
