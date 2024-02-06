import { Node } from '~/lib/vault-prosemirror'

export const DocumentNode = Node.create({
  name: 'doc',
  spec() {
    return {
      content: 'block+'
    }
  },
})

export const TextNode = Node.create({
  name: 'text',
  spec() {
    return {
      inline: true
    }
  },
})

export const ParagraphNode = Node.create({
  name: 'paragraph',
  spec() {
    return {
      group: 'block',
      content: "(text | hashtag | reference)*",
      toDOM(node) { return ["p", 0] },
    }
  },
})

