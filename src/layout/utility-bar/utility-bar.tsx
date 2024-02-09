import { useMemo } from 'react';
import { Accordion } from '@ark-ui/react'

import { observer } from 'mobx-react-lite';
import { useDbQuery } from '~/query-manager';
import { sql } from 'kysely';
import { useRootService } from '~/services/root.service';
import { EntityEditor } from '~/features/entity-editor';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

export const UtilityBar = observer(() => {
  const root = useRootService()

  const selectedEntityId = useMemo(() => {
    const tab = root.windowService.activeTab
    if (tab && tab?.type === 'entity_view') {
      return tab.meta.entityId
    }
    return null
  }, [root.windowService.activeTab])

  const { data: entityGraph } = useDbQuery({
    keys: [selectedEntityId],
    query: (db) => {
      const toQuery = db.selectFrom('entity_graph')
        .innerJoin('entity', 'entity.id', 'entity_graph.to_entity_id')
        .where('entity_graph.entity_id', '=', selectedEntityId)
        .selectAll('entity')
        .select([
          sql<string>`'to'`.as('direction'), 
          'entity_graph.data as graph_data', 
          'entity_graph.to_entity_id as to_entity_id',
          'entity_graph.entity_id as from_entity_id'
        ])
      const fromQuery = db.selectFrom('entity_graph')
        .innerJoin('entity', 'entity.id', 'entity_graph.entity_id')
        .where('entity_graph.to_entity_id', '=', selectedEntityId)
        .selectAll('entity')
        .select([
          sql<string>`'from'`.as('direction'), 
          'entity_graph.data as graph_data', 
          'entity_graph.to_entity_id as to_entity_id',
          'entity_graph.entity_id as from_entity_id'
        ])
        
      return toQuery.unionAll(fromQuery)
    },
    enabled: selectedEntityId !== null
  })

  const toGraph = useMemo(() => {
    return entityGraph.filter((e) => e.direction === 'to')
  }, [entityGraph])

  const fromGraph = useMemo(() => {
    return entityGraph.filter((e) => e.direction === 'from')
  }, [entityGraph])

  const onClickEntityLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    const entityId = parseInt(e.currentTarget.dataset.entityId || '', 10)
    const entity = entityGraph.find((g) => g.id === entityId)

    if (entity) {
      root.windowService.addTab({
        type: 'entity_view',
        meta: {
          entityId,
        },
        name: entity.title
      })
    }
  }

  return (
    <div className="w-full">

      <Accordion.Root collapsible>
        <Accordion.Item value="incoming">
          {(api) => (
            <>
              <Accordion.ItemTrigger className='pl-3 py-1 font-bold flex items-center'>
                References {`(${fromGraph.length})`}
                <Accordion.ItemIndicator>
                  {api.isOpen ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>
              <Accordion.ItemContent className='h-[300px] bg-tertiary overflow-y-auto'>
                <div className="flex flex-col">
                  {fromGraph.map((e) => (
                    <div className="px-[50px] py-10">
                      <EntityEditor entityId={e.from_entity_id} selectedBlockId={e.graph_data.document.blockId} />
                    </div>
                  ))}
                </div>
              </Accordion.ItemContent>
            </>
          )}
        </Accordion.Item>
      </Accordion.Root>
        {/* <div>
          <div className="font-bold pl-3 py-1">Outgoing Links {`(${toGraph.length})`}</div>
          <div className="flex flex-col gap-2">
            {toGraph.map((e) => (
                <EntityEditor entityId={e.from_entity_id} selectedBlockId={e.graph_data.document.blockId} simple={true} />
              // <button onClick={onClickEntityLink} className="text-left bg-tertiary py-1 px-2 rounded-md" data-entity-id={e.id}>
              //   <div>{e.type}: {e.title}</div>
              // </button>
            ))}
          </div>
        </div> */}
    </div>
  )
})

/**
 * incoming:
 * 
 * outgoing:
 * 
 * unlinked incoming:
 *  
 */