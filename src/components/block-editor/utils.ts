import { nanoid } from 'nanoid'

import { schema } from './schema'

export const generateBlockId = () => nanoid(5)

export function generateDefaultDoc() {
  const schemaDoc = schema.node('doc', null, [
      schema.nodes.lineblock.create({
        blockId: generateBlockId(),
      }, 
        [schema.nodes.paragraph.create(null, [schema.text("Hello, it's meee!")])]
      )
    ]
  )
  return schemaDoc
}