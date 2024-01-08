import { Schema } from "prosemirror-model"

export const schema = new Schema({
  nodes: {
    doc: {content: "lineblock+"},
    paragraph: {
      group: 'block',
      content: "text*",
      toDOM(node) { return ["p", 0] },
    },
    lineblock: {
      group: 'block',
      content: "block*",
      parseDOM: [
        { tag: 'lineblock' }
      ],
    },
    codemirror: {
      group: 'block',
      content: "text*",
      attrs: {
        scriptId: {
          default: null,
        }
      },
      code: true,
      isolating: true,
      selectable: true,
      parseDOM: [
        { tag: 'codemirror' }
      ],
    },
    scriptblock: {
      group: 'block',
      content: 'codemirror',
      attrs: {
        id: {
          default: null,
        }
      },
      selectable: false,
      parseDOM: [
        { tag: 'scriptblock' }
      ],
    },
    tableblock: {
      group: 'block',
      atom: true,
      isolating: true,
      selectable: true,
      attrs: {
        entityId: {
          default: null,
        },
      },
      parseDOM: [
        { tag: 'tableblock' }
      ],
    },
    text: {
      inline: true
    },
  }
})