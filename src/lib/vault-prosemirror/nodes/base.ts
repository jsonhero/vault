import { VaultDocumentNode } from '../node'

export const DocumentNode = VaultDocumentNode.create({
  name: 'doc',
  spec() {
    return {
      content: 'block+'
    }
  },
})

export const TextNode = VaultDocumentNode.create({
  name: 'text',
  spec() {
    return {
      inline: true
    }
  },
})

export const ParagraphNode = VaultDocumentNode.create({
  name: 'paragraph',
  spec() {
    return {
      group: 'block',
      content: "(text)*",
      toDOM(node) { return ["p", 0] },
    }
  },
})

