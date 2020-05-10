/** @babel */
// @flow

import { BabelBuilder } from './babel-builder/babel-builder'

/*::
import type { Builder } from './builder';
*/

const registeredBuilders /*: Builder<any>[] */ = [
  BabelBuilder
]

export function getBuilder (ext /*: string */, file /*: string */) /*: ?Builder<any> */ {
  for (const builder of registeredBuilders) {
    if (builder.test(ext, file)) {
      return builder
    }
  }

  return null
}
