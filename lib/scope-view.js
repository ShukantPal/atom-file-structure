/** @babel */
/** @jsx etch.dom */
// @flow

import etch from 'etch'

/*::
import type { View } from 'etch';
*/

export class ScopeView/*:: <T> */ {
  /*:: props: T */
  /*:: children: View[] */

  update (props /*: $Shape<T> */, children /*:: ? : View[] */) {
    this.props = Object.assign(this.props, props)
    this.children = children || (this.children || [])

    etch.update(this, false)
  }

  async destroy () {
    await etch.destroy(this)
  }
}
