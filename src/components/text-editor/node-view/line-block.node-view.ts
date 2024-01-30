import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";

export class LineBlockNodeView {
  dom;
  contentDOM;
  node;
  // https://stackoverflow.com/questions/25897883/edit-cursor-not-displayed-on-chrome-in-contenteditable
  decorations;
  constructor(
    node: Node,
    decorations: readonly Decoration[]
  ) {
    const isHidden = decorations.find((dec) => dec.spec.hidden)
    this.decorations = decorations


    const focusDecor = decorations.find((dec) => dec.spec.focusDepth)
    const focusDepth = focusDecor?.spec.focusDepth

    this.dom = this.contentDOM = document.createElement('div')
    this.dom.className = isHidden ? 'hidden' : "block"
    this.dom.setAttribute('data-block-id', node.attrs.blockId)
    if (node.attrs.blockGroupId) {
      this.dom.setAttribute('data-block-group-id', node.attrs.blockGroupId)
    }

    this.dom.setAttribute('data-depth', node.attrs.depth)
    this.dom.style.left = 28 * (node.attrs.depth - (focusDepth || 0)) + 'px'



    this.dom.style.position = 'relative'

    this.dom.style.paddingTop = "2px"
    this.dom.style.paddingBottom = "2px"

    this.node = node;
  }

  update(node: Node, decorations: readonly Decoration[], innerDecorations: DecorationSource) {
    if (!this.node.attrs.blockGroupId !== node.attrs.blockGroupId) {
      this.dom.setAttribute('data-block-group-id', node.attrs.blockGroupId)
    }

    const focusDecor = decorations.find((dec) => dec.spec.focusDepth)
    const focusDepth = focusDecor?.spec.focusDepth

    if (node.attrs.depth !== this.node.attrs.depth || decorations !== this.decorations) {
      this.dom.setAttribute('data-depth', node.attrs.depth)
      // adjust to focus depth
      this.dom.style.left = 28 * (node.attrs.depth - (focusDepth || 0)) + 'px'
    }

    const isHidden = decorations.find((dec) => dec.spec.hidden)
    

    // shouldn't do this every update
    if (isHidden) {
      this.dom.className = "hidden"
    } else if (!isHidden) {
      this.dom.className = "block"
    }

    this.node = node

    this.decorations = decorations

    return true
  }
}