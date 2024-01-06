import { EditorState } from 'prosemirror-state';
import { useCallback, useMemo } from 'react';

import { TextEditor } from '~/components/text-editor'
import { Entity } from '~/types/db-types'
import { TitleEditor } from '~/features/title-editor';
import { useDatabase, useQuery  } from '~/context/database-context';

type QueryType = Entity & { document_doc: string, document_id: number }

export const DocumentEditor = ({ entityDocId }: { entityDocId: number }) => {
  const db = useDatabase()

  const entityDocument = useQuery<QueryType>(
    "SELECT entity.*, d.doc as document_doc , d.id as document_id, d.doc_text FROM entity INNER JOIN document d ON d.entity_id = entity.id WHERE entity.id = ?",
    [entityDocId],
    {
      takeFirst: true,
    }
  ).data;

  const saveDocument = async (documentId: number, docJson: any, docText: string) => {
    await db.execute("UPDATE document SET doc = ?, doc_text = ? WHERE id = ? RETURNING *", [JSON.stringify(docJson), docText, documentId])
  }

  const onEditorUpdate = useCallback((state: EditorState) => {
    if (entityDocument) {
      saveDocument(entityDocument!.document_id, state.toJSON(), state.doc.textContent)
    }
  }, [entityDocument])

  const docJson = useMemo(() => entityDocument?.document_doc, [entityDocument?.document_id])
  
  return (
    <div>
      <TitleEditor entity={entityDocument} />
      <TextEditor docId={entityDocument?.document_id} docJson={docJson} onUpdate={onEditorUpdate} />
    </div>
  )
}