import { Node as ProseMirrorNode } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";

import { Node } from '~/lib/vault-prosemirror'

class LineBlockNodeView {
  dom;
  contentDOM;
  node;
  // https://stackoverflow.com/questions/25897883/edit-cursor-not-displayed-on-chrome-in-contenteditable
  decorations;
  constructor(
    node: ProseMirrorNode,
    decorations: readonly Decoration[]
  ) {
    const isHidden = decorations.find((dec) => dec.spec.hidden)
    this.decorations = decorations


    this.dom = this.contentDOM = document.createElement('div')
    this.dom.className = isHidden ? 'hidden' : "block"
    this.dom.setAttribute('data-block-id', node.attrs.blockId)

    this.dom.setAttribute('data-depth', node.attrs.depth)
    this.dom.style.left = `calc(var(--block-margin) * (${node.attrs.depth} - var(--focus-depth)))`
    // this.dom.style.left = 28 * (node.attrs.depth - (focusDepth || 0)) + 'px'



    this.dom.style.position = 'relative'

    this.dom.style.paddingTop = "2px"
    this.dom.style.paddingBottom = "2px"

    this.node = node;
  }

  update(node: ProseMirrorNode, decorations: readonly Decoration[], innerDecorations: DecorationSource) {

    if (node.attrs.depth !== this.node.attrs.depth) {
      this.dom.setAttribute('data-depth', node.attrs.depth)
      // adjust to focus depth
      this.dom.style.left = `calc(var(--block-margin) * (${node.attrs.depth} - var(--focus-depth)))`
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

export const LineblockNode = Node.create({
  name: 'lineblock',
  spec() {
    return {
      group: 'block',
      content: "block*",
      parseDOM: [
        { tag: 'lineblock' }
      ],
      attrs: {
        blockId: {
          default: null,
        },
        depth: {
          default: 0
        },
      }
    }
  },
  nodeView(props) {
    return new LineBlockNodeView(props.node, props.decorations)
  },
})