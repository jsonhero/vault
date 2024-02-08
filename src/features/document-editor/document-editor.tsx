import { EditorState } from 'prosemirror-state';
import { useCallback, useMemo } from 'react';
import _ from 'lodash'

import { TextEditor } from '~/components/text-editor'
import { Entity } from '~/types/db-types'
import { useTakeFirstDbQuery } from '~/query-manager';
import { documentService } from '~/services/document.service';
import { useRootService } from '~/services/root.service';
import { entityGraphService } from '~/services/entity-graph.service';
import { BlockEditor } from '~/components/block-editor/block-editor';

export const DocumentEditor = ({ entity, selectedBlockId, simple }: { entity: Entity }) => {

  const { data: document } = useTakeFirstDbQuery({
    keys: [entity.id],
    query: (db) => db.selectFrom('document')
      .where('entity_id', '=', entity.id)
      .selectAll(),
  })

  const root = useRootService()

  const onEditorUpdate = useCallback(async (state: EditorState) => {

    const taggedBlocks: any[] = []

    let currentBlockId: null | string = null

    let currentBlockTags: string[] = []

    const referenceEdges: any[] = []

    state.doc.descendants((node) => {
      if (node.type.name === 'hashtag') {
        // remove # at start
        currentBlockTags.push(node.textContent.slice(1))
      }

      if (node.type.name === 'reference') {
        referenceEdges.push({
          type: 'reference',
          toEntityId: node.attrs.entityId,
          data: {
            document: {
              blockId: currentBlockId
            }
          }
        })
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
      await documentService.update(document.id, doc, docText, manifest)
    } else {
      await documentService.insert(entity.id, doc, docText, manifest)
    }

    if (referenceEdges.length > 0) {
      await entityGraphService.replaceEdges(entity.id, referenceEdges)
    }
  }, [entity.id, document?.id])

  const throttleUpdate = useMemo(() => {
    return _.throttle(onEditorUpdate, 300, {
      leading: true,
      trailing: true,
    })
  }, [onEditorUpdate])

  const docJson = useMemo(() => document?.doc, [document?.id])
  
  return (
    <div>
      <BlockEditor
        extensions={root.extensionService.extensions}
        selectedBlockId={selectedBlockId}
        renderId={`${entity.id}:${document?.id}`} 
        documentJson={docJson} 
        onUpdate={throttleUpdate} 
        simple={simple}
      />
    </div>
  )
}