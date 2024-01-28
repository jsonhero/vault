import { EditorState } from 'prosemirror-state';
import { useCallback, useMemo } from 'react';

import { TextEditor } from '~/components/text-editor'
import { Entity } from '~/types/db-types'
import { useTakeFirstDbQuery } from '~/query-manager';
import { documentService } from '~/services/document.service';

export const DocumentEditor = ({ entity }: { entity: Entity }) => {

  const { data: document } = useTakeFirstDbQuery({
    keys: [entity.id],
    query: (db) => db.selectFrom('document')
      .where('entity_id', '=', entity.id)
      .selectAll(),
  })

  const onEditorUpdate = useCallback(async (state: EditorState) => {

    const taggedBlocks: any[] = []

    let currentBlockId: null | string = null

    let currentBlockTags: string[] = []

    state.doc.descendants((node) => {
      if (node.type.name === 'hashtag') {
        // remove # at start
        currentBlockTags.push(node.textContent.slice(1))
      }

      if (node.type.name === 'lineblock') {
        if (currentBlockId !== null && currentBlockTags.length) {
          taggedBlocks.push({
            blockId: currentBlockId,
            tags: currentBlockTags,
          })
        }
        currentBlockId = node.attrs.blockId
        currentBlockTags = []
      }
      
      return node.type.name !== 'text'
    })

    if (currentBlockId !== null && currentBlockTags.length) {
      taggedBlocks.push({
        blockId: currentBlockId,
        tags: currentBlockTags,
      })
    }

    const manifest = {
      taggedBlocks,
    }
    const doc = state.toJSON()
    const docText = state.doc.textContent
    if (document?.id) {
      documentService.update(document.id, doc, docText, manifest)
    } else {
      documentService.insert(entity.id, doc, docText, manifest)
    }
  }, [entity.id, document?.id])

  const docJson = useMemo(() => document?.doc, [document?.id])
  
  return (
    <div>
      <TextEditor renderId={`${entity.id}:${document?.id}`} docJson={docJson} onUpdate={onEditorUpdate} />
    </div>
  )
}