import { Entity } from '~/types/db-types'
import { TitleEditor } from '~/features/title-editor';
import { useQuery  } from '~/context/database-context';
import { TableEditor } from '~/features/table-editor';
import { DocumentEditor } from '../document-editor';

export const EntityEditor = ({ entityId }: { entityId: number }) => {

  const entity = useQuery<Entity>(
    `SELECT 
        entity.*
    FROM entity
    WHERE entity.id = ?`,
    [entityId],
    {
      takeFirst: true,
    }
  ).data;

  console.log(entity, ':: entity baby')

  return (
    <div>
      <TitleEditor entity={entity} />
      {entity.type === 'document' && <DocumentEditor entity={entity} />}
      {entity.type === 'table' && <TableEditor entity={entity} />}
    </div>
  )
}