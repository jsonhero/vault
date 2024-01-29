import { Node } from "prosemirror-model";
import { rootService } from "~/services/root.service";

export class HashtagNodeView {
  dom;
  contentDOM;
  node;

  constructor(node: Node) {
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