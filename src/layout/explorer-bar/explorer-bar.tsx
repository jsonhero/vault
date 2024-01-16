import { useState } from "react";
import { FolderTreeIcon, ListIcon } from 'lucide-react'
import { useAppStateService } from "~/features/app-state";
import { Entity } from "~/types/db-types";
import { FileExplorer } from '~/features/file-explorer'

import { useObservableQuery  } from "~/query-manager";
import { observer } from "mobx-react-lite";

export const ExplorerBar = observer(() => {
  const appState = useAppStateService()
  const [active, setActive] = useState('file_tree')

  const { data: entities } = useObservableQuery(
    (db) => db.selectFrom('entity')
        .where('type', 'in', ['table', 'document'])
        .orderBy('updated_at desc')
        .selectAll(),
        {
          autoLoad: true,
        }
  )

  const onSelectEntity = (entity: Entity) => {
    appState.setSelectedEntityId(entity.id)
  }  
  
  return (
    <div className="w-full h-full">
      <div className="flex w-full justify-center py-3 gap-2">
        <button onClick={() => setActive('file_tree')} style={{
          color: active !== 'file_tree' ? 'rgba(255, 255, 255, 0.3)' : 'inherit'
        }}>
          <FolderTreeIcon size={18} />
        </button>
        <button onClick={() => setActive('file_list')} style={{
          color: active !== 'file_list' ? 'rgba(255, 255, 255, 0.3)' : 'inherit'
        }}>
          <ListIcon size={18} />
        </button>
      </div>

      {active === 'file_tree' && (
        <div>
          <FileExplorer />
        </div>
      )}
      {active === 'file_list' && (
        <div className="px-5 py-3">
          {entities.map((d) => (<button className="w-full text-left text-sm"  key={d.id} onClick={() => onSelectEntity(d)}>{`${d.id}:${d.type}:${d.title}`}</button>))}
        </div>
      )}
    </div>
  )
})