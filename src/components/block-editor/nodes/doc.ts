import { Node } from '~/lib/vault-prosemirror'

export const DocumentNode = Node.create({
  name: 'doc',
  spec() {
    return {
      content: 'block+'
    }
  },
})