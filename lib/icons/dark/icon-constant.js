/** @babel */
/** @jsx etch.dom */

import etch from 'etch'

export default class IcDarkConstant {
  constructor () {
    etch.initialize(this)
  }

  render () {
    return (
      <svg
        viewBox="0 0 20 20"
        id="svg4604"
        version="1.1"
        width="20"
        height="20">
        <defs
          id="defs4618" />
        <style
          id="style4606">.icon-canvas-transparent &#123;opacity:0;fill:#f6f6f6}.icon-vs-out &#123;fill:#f6f6f6}.icon-vs-bg &#123;fill:#424242}.icon-vs-fg &#123;fill:#f0eff1}.icon-vs-action-blue &#123;fill:#00539c}</style>
        <g
          id="g4625"
          transform="translate(2,-2)">
          <path
            style="opacity:0;fill:#f6f6f6"
            id="canvas"
            d="M 16,20 0,20 0,4 16,4 16,20 Z"
            class="icon-canvas-transparent" />
          <g
            id="g4622">
            <path
              class="icon-vs-out"
              d="M 2.879,18 1,16.121 1,7.879 2.879,6 13.121,6 15,7.879 15,16.121 13.121,18 2.879,18 Z"
              id="outline"
              style="fill:#f6f6f6" />
          </g>
          <path
            style="fill:#f0eff1"
            id="iconFg"
            d="M 12.293,8 3.707,8 3,8.707 3,15.293 3.707,16 12.293,16 13,15.293 13,8.707 12.293,8 Z M 11,14 l -6,0 0,-1 6,0 0,1 z m 0,-3 -6,0 0,-1 6,0 0,1 z"
            class="icon-vs-fg" />
          <g
            transform="translate(0,4)"
            id="iconBg">
            <path
              style="fill:#424242"
              id="path4612"
              d="M 12.707,13 3.293,13 2,11.707 2,4.293 3.293,3 12.707,3 14,4.293 14,11.707 12.707,13 Z m -9,-1 8.586,0 L 13,11.293 13,4.707 12.293,4 3.707,4 3,4.707 3,11.293 3.707,12 Z"
              class="icon-vs-bg" />
            <path
              style="fill:#00539c"
              id="path4614"
              d="m 11,7 -6,0 0,-1 6,0 0,1 z m 0,2 -6,0 0,1 6,0 0,-1 z"
              class="icon-vs-action-blue" />
          </g>
        </g>
      </svg>
    )
  }

  update () {}
}
