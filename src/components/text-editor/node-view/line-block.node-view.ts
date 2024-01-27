import { Node } from "prosemirror-model";

export class LineBlockNodeView {
  dom;
  contentDOM;
  node;

  constructor(node: Node) {
    this.dom = this.contentDOM = document.createElement('div')
    this.dom.className = node.attrs.hidden ? "hidden" : "block"
    this.dom.setAttribute('data-block-id', node.attrs.blockId)
    if (node.attrs.blockGroupId) {
      this.dom.setAttribute('data-block-group-id', node.attrs.blockGroupId)
    }

    if (node.attrs.blockGroupDepth !== null) {
      this.dom.setAttribute('data-block-group-depth', node.attrs.blockGroupDepth)
      this.dom.style.left = 18 * node.attrs.blockGroupDepth + 'px'
    }

    this.dom.setAttribute('data-depth', node.attrs.depth)
    this.dom.style.left = 18 * node.attrs.depth + 'px'



    this.dom.style.position = 'relative'

    this.dom.style.paddingTop = "2px"
    this.dom.style.paddingBottom = "2px"

    this.node = node;
  }

  update(node: Node) {
    if (!this.node.attrs.blockGroupId !== node.attrs.blockGroupId) {
      this.dom.setAttribute('data-block-group-id', node.attrs.blockGroupId)
    }

    if (node.attrs.depth !== this.node.attrs.depth) {
      this.dom.setAttribute('data-depth', node.attrs.depth)
      this.dom.style.left = 18 * node.attrs.depth + 'px'
    }

    if (node.attrs.blockGroupDepth !== null) {
      this.dom.setAttribute('data-block-group-depth', node.attrs.blockGroupDepth)

      this.dom.style.left = 18 * node.attrs.blockGroupDepth + 'px'
    }

    if (node.attrs.hidden && !this.node.attrs.hidden) {
      this.dom.className = "hidden"
    } else if (this.node.attrs.hidden && !node.attrs.hidden) {
      this.dom.className = "block"
    }

    this.node = node

    return true
  }
}