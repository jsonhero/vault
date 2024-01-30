import { Node } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { rootService } from "~/services/root.service";

export class HashtagNodeView {
  dom;
  contentDOM;
  node;
  view;
  getPos;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
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

  update(node: Node) {
    this.node = node
  }
}