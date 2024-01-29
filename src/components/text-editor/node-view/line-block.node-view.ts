import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";

export class LineBlockNodeView {
  dom;
  contentDOM;
  node;
  // https://stackoverflow.com/questions/25897883/edit-cursor-not-displayed-on-chrome-in-contenteditable

  constructor(node: Node) {
    this.dom = this.contentDOM = document.createElement('div')
    this.dom.className = "block"
    this.dom.setAttribute('data-block-id', node.attrs.blockId)
    if (node.attrs.blockGroupId) {
      this.dom.setAttribute('data-block-group-id', node.attrs.blockGroupId)
    }

    this.dom.setAttribute('data-depth', node.attrs.depth)
    this.dom.style.left = 28 * node.attrs.depth + 'px'



    this.dom.style.position = 'relative'

    this.dom.style.paddingTop = "2px"
    this.dom.style.paddingBottom = "2px"

    this.node = node;
  }

  update(node: Node, decorations: readonly Decoration[], innerDecorations: DecorationSource) {
    if (!this.node.attrs.blockGroupId !== node.attrs.blockGroupId) {
      this.dom.setAttribute('data-block-group-id', node.attrs.blockGroupId)
    }

    if (node.attrs.depth !== this.node.attrs.depth) {
      this.dom.setAttribute('data-depth', node.attrs.depth)
      this.dom.style.left = 28 * node.attrs.depth + 'px'
    }

    const isHidden = decorations.find((dec) => dec.spec.hidden)
    

    // shouldn't do this every update
    if (isHidden) {
      this.dom.className = "hidden"
    } else if (!isHidden) {
      this.dom.className = "block"
    }

    this.node = node

    return true
  }
}