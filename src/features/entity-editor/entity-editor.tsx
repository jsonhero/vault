import { TitleEditor } from '~/features/title-editor';
import { TableEditor } from '~/features/table-editor';
import { DocumentEditor } from '../document-editor';
import { useTakeFirstDbQuery } from '~/query-manager';

export const EntityEditor = ({ entityId, selectedBlockId, simple, onSelectBlockId }: { entityId: number }) => {

  const { data: entity } = useTakeFirstDbQuery({
    keys: [entityId],
    query: (db) => db.selectFrom('entity')
      .where('id', '=', entityId)
      .selectAll(),
    reactiveRowId: BigInt(entityId),
    reactiveTableName: 'entity',
  })

  if (!entity) return null;

  return (
    <>
      {!selectedBlockId && 
      (
        <div className="left-0 sticky z-10 pt-10 pb-4 px-16">
          <TitleEditor entity={entity} />
        </div>
    )}
      {entity.type === 'document' && <DocumentEditor selectedBlockId={selectedBlockId} entity={entity} simple={simple} onSelectBlockId={onSelectBlockId} />}
      {entity.type === 'table' && <TableEditor entity={entity} />}
    </>
  )
}