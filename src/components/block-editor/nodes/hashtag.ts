import { Node as ProseMirrorNode } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { Node } from "~/lib/vault-prosemirror";
import { rootService } from "~/services/root.service";

export class HashtagNodeView {
  dom;
  contentDOM;
  node;
  view;
  getPos;

  constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) {
    this.view = view;
    this.getPos = getPos
    const button = document.createElement('button')

    button.onclick = () => {
      const tag = this.node.textContent.slice(1)
      rootService.windowService.addTab({
        type: 'hashtag_view',
        meta: {
          tag,
        },
        name: '#' + tag,
      })
    }
    this.dom = this.contentDOM = button
    this.dom.className = "text-green-500"
    this.node = node;
  }

  update(node: ProseMirrorNode) {
    this.node = node
    return true
  }
}

export const HashtagNode = Node.create({
  name: 'hashtag',
  spec() {
    return {
      inline: true,
      group: 'inline',
      content: 'text*',
      parseDOM: [
        { tag: 'hashtag' }
      ],
    }
  },
  nodeView(props) {
    return new HashtagNodeView(props.node, props.view, props.getPos)
  },
})