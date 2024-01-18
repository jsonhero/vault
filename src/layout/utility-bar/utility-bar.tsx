import { useMemo } from 'react';

import { useAppStateService } from '~/features/app-state';
import { observer } from 'mobx-react-lite';
import { useDbQuery } from '~/query-manager';
import { sql } from 'kysely';

export const UtilityBar = observer(() => {
  const appState = useAppStateService()

  const { data: entityGraph } = useDbQuery({
    keys: [appState.selectedEntityId],
    query: (db) => {
      const toQuery = db.selectFrom('entity_graph')
        .innerJoin('entity', 'entity.id', 'entity_graph.to_entity_id')
        .where('entity_graph.entity_id', '=', appState.selectedEntityId)
        .selectAll('entity')
        .select(sql.val<string>`to`.as('direction'))
      const fromQuery = db.selectFrom('entity_graph')
        .innerJoin('entity', 'entity.id', 'entity_graph.entity_id')
        .where('entity_graph.to_entity_id', '=', appState.selectedEntityId)
        .selectAll('entity')
        .select(sql.val<string>`from`.as('direction'))
        
      return toQuery.unionAll(fromQuery)
    }
  })

  const toGraph = useMemo(() => {
    return entityGraph.filter((e) => e.direction === 'to')
  }, [entityGraph])

  const fromGraph = useMemo(() => {
    return entityGraph.filter((e) => e.direction === 'from')
  }, [entityGraph])

  const onClickEntityLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    const entityId = parseInt(e.currentTarget.dataset.entityId || '', 10)
    appState.setSelectedEntityId(entityId)
  }

  return (
    <div className="w-full h-full p-5">
      <div className="flex flex-col gap-3">
        <div>
          <div className="font-bold">Incoming Links {`(${fromGraph.length})`}</div>
          <div className="mt-2 flex flex-col gap-2">
            {fromGraph.map((e) => (
              <button onClick={onClickEntityLink} className="text-left bg-tertiary py-1 px-2 rounded-md" data-entity-id={e.id}>
                <div>{e.type}: {e.title}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="font-bold">Outgoing Links {`(${toGraph.length})`}</div>
          <div className="mt-2 flex flex-col gap-2">
            {toGraph.map((e) => (
              <button onClick={onClickEntityLink} className="text-left bg-tertiary py-1 px-2 rounded-md" data-entity-id={e.id}>
                <div>{e.type}: {e.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})