import { Schema, MarkSpec, DOMOutputSpec } from "prosemirror-model"
const emDOM: DOMOutputSpec = ["em", 0], strongDOM: DOMOutputSpec = ["strong", 0], codeDOM: DOMOutputSpec = ["code", 0]

export const schema = new Schema({

  marks: {
    /// A strong mark. Rendered as `<strong>`, parse rules also match
    /// `<b>` and `font-weight: bold`.
    strong: {
      parseDOM: [
        {tag: "strong"},
        // This works around a Google Docs misbehavior where
        // pasted content will be inexplicably wrapped in `<b>`
        // tags with a font-weight normal.
        {tag: "b", getAttrs: (node: HTMLElement) => node.style.fontWeight != "normal" && null},
        {style: "font-weight=400", clearMark: m => m.type.name == "strong"},
        {style: "font-weight", getAttrs: (value: string) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null},
      ],
      toDOM() { return strongDOM }
    } as MarkSpec,
  },
  nodes: {
    doc: {content: "block+"},
    paragraph: {
      group: 'block',
      content: "(text | hashtag | reference)*",
      toDOM(node) { return ["p", 0] },
    },
    bold: {
      inline: true,
      content: 'text*',
    },
    hashtag: {
      inline: true,
      content: 'text*',
      parseDOM: [
        { tag: 'hashtag' }
      ],
    },
    reference: {
      inline: true,
      atom: true,
      parseDOM: [
        { tag: 'reference' }
      ],
      attrs: {
        entityId: {
          default: null,
        }
      }
    },
    entity_record: {
      group: 'block',
      atom: true,
      parseDOM: [
        { tag: 'entity_record' }
      ],
      attrs: {
        entityId: {
          default: null,
        }
      }
    },
    todo: {
      group: 'block',
      content: 'paragraph',
      parseDOM: [
        { tag: 'todo' }
      ],
      attrs: {
        entityId: {
          default: null,
        }
      }
    },
    lineblock: {
      group: 'block',
      content: "block*",
      parseDOM: [
        { tag: 'lineblock' }
      ],
      attrs: {
        blockId: {
          default: null,
        },
        blockGroupId: {
          default: null,
        },
        blockGroupDepth: {
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


