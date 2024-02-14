import { Node } from '~/lib/vault-prosemirror'

export const ParagraphNode = Node.create({
  name: 'paragraph',
  spec() {
    return {
      group: 'block',
      content: "inline*",
      toDOM(node) { return ["p", 0] },
    }
  },
})

