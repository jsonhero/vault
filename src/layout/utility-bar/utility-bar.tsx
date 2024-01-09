import { useMemo } from 'react';

import { Entity } from '~/types/db-types'
import { useQuery  } from '~/context/database-context';
import { useAppStateService } from '~/features/app-state';
import { observer } from 'mobx-react-lite';

type EntityWithRef = Entity & { direction: 'to' | 'from' }

export const UtilityBar = observer(() => {
  const appState = useAppStateService()

  const entityGraph = useQuery<EntityWithRef[]>(`
    SELECT entity.*, 'to' as direction FROM entity_graph eg INNER JOIN entity ON entity.id = eg.to_entity_id WHERE eg.entity_id = ?
    UNION ALL
    SELECT entity.*, 'from' as direction FROM entity_graph eg INNER JOIN entity ON entity.id = eg.entity_id WHERE eg.to_entity_id = ?
  `, [appState.selectedEntityId, appState.selectedEntityId]).data

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
                <div>{e.title}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="font-bold">Outgoing Links {`(${toGraph.length})`}</div>
          <div className="mt-2 flex flex-col gap-2">
            {toGraph.map((e) => (
              <button onClick={onClickEntityLink} className="text-left bg-tertiary py-1 px-2 rounded-md" data-entity-id={e.id}>
                <div>{e.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})