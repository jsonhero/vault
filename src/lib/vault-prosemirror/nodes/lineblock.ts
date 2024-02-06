import { VaultDocumentNode } from '../node'
import { LineBlockNodeView } from '~/components/text-editor/node-view/line-block.node-view'

export const LineblockNode = VaultDocumentNode.create({
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
        hidden: {
          default: false
        },
        groupHidden: {
          default: false,
        },
      }
    }
  },
  nodeView(props) {
    return new LineBlockNodeView(props.node, props.decorations)
  },
})