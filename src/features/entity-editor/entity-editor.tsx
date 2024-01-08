import { Entity } from '~/types/db-types'
import { TitleEditor } from '~/features/title-editor';
import { useQuery  } from '~/context/database-context';
import { TableEditor } from '~/features/table-editor';
import { DocumentEditor } from '../document-editor';
import { useMemo } from 'react';

type EntityWithRef = Entity & { direction: 'to' | 'from' }

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

  const entityGraph = useQuery<EntityWithRef[]>(`
    SELECT entity.*, 'to' as direction FROM entity_graph eg INNER JOIN entity ON entity.id = eg.to_entity_id WHERE eg.entity_id = ?
    UNION ALL
    SELECT entity.*, 'from' as direction FROM entity_graph eg INNER JOIN entity ON entity.id = eg.entity_id WHERE eg.to_entity_id = ?
  `, [entityId, entityId]).data

  const toGraph = useMemo(() => {
    return entityGraph.filter((e) => e.direction === 'to')
  }, [entityGraph])

  const fromGraph = useMemo(() => {
    return entityGraph.filter((e) => e.direction === 'from')
  }, [entityGraph])

  return (
    <div>
      <div>
        <div>
          <div>To</div>
          <div>
            {toGraph.map((e) => <div>{e.title}</div>)}
          </div>
        </div>
        <div>
          <div>From</div>
          <div>
            {fromGraph.map((e) => <div>{e.title}</div>)}
          </div>
        </div>
      </div>
      <TitleEditor entity={entity} />
      {entity.type === 'document' && <DocumentEditor entity={entity} />}
      {entity.type === 'table' && <TableEditor entity={entity} />}
    </div>
  )
}