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
    const doc = state.toJSON()
    const docText = state.doc.textContent
    if (document?.id) {
      documentService.update(document.id, doc, docText)
    } else {
      documentService.insert(entity.id, doc, docText)
    }
  }, [entity.id, document?.id])

  const docJson = useMemo(() => document?.doc, [document?.id])
  
  return (
    <div>
      <TextEditor renderId={`${entity.id}:${document?.id}`} docJson={docJson} onUpdate={onEditorUpdate} />
    </div>
  )
}