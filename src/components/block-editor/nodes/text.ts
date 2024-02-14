import { Node } from '~/lib/vault-prosemirror'

export const TextNode = Node.create({
  name: 'text',
  spec() {
    return {
      group: 'inline',
      inline: true
    }
  },
})