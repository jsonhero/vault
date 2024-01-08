import { EditorState } from 'prosemirror-state';
import { useCallback, useMemo } from 'react';

import { TextEditor } from '~/components/text-editor'
import { Entity, EntityDocument } from '~/types/db-types'
import { useDatabase, useQuery  } from '~/context/database-context';

export const DocumentEditor = ({ entity }: { entity: Entity }) => {
  const db = useDatabase()

  const document = useQuery<EntityDocument | null>(
    "SELECT * FROM document WHERE entity_id = ?",
    [entity.id],
    {
      takeFirst: true,
      jsonFields: ['doc']
    }
  ).data;

  const onEditorUpdate = useCallback(async (state: EditorState) => {
    const bindings = [JSON.stringify(state.toJSON()), state.doc.textContent]
    if (document?.id) {
      await db.execute("UPDATE document SET doc = ?, doc_text = ? WHERE id = ? RETURNING *", [...bindings, document.id])
    } else {
      await db.execute("INSERT INTO document (doc, doc_text, entity_id) VALUES(?, ?, ?)", [...bindings, entity.id])
    }
  }, [entity.id, document?.id])

  const docJson = useMemo(() => document?.doc, [document?.id])
  
  return (
    <div>
      <TextEditor renderId={`${entity.id}:${document?.id}`} docJson={docJson} onUpdate={onEditorUpdate} />
    </div>
  )
}