import { Node } from "prosemirror-model";

export class HashtagNodeView {
  dom;
  contentDOM;
  node;

  constructor(node: Node) {
    this.dom = this.contentDOM = document.createElement('span')
    this.dom.className = "text-green-500"
    this.node = node;

    console.log(this.node, 'Nodey')
  }
}