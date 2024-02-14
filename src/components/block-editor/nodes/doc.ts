import { Node } from '~/lib/vault-prosemirror'

export const DocumentNode = Node.create({
  name: 'doc',
  spec() {
    return {
      // TODO: change to lineblock+ soon
      content: 'block+'
    }
  },
})