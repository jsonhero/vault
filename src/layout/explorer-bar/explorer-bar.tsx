import { useState } from "react";
import { FolderTreeIcon, ListIcon } from 'lucide-react'
import { Entity } from "~/types/db-types";
import { FileExplorer } from '~/features/file-explorer'

import { useDbQuery  } from "~/query-manager";
import { useRootService } from "~/services/root.service";

import { Button } from '~/components/ui/button'

export const ExplorerBar = () => {
  const [active, setActive] = useState('file_list')

  const root = useRootService()

  const { data: entities } = useDbQuery(
    {
      query: (db) => db.selectFrom('entity')
        .where('type', 'in', ['table', 'document'])
        .orderBy('updated_at', 'desc')
        .selectAll(),
    }
  )


  const onSelectEntity = (entity: Entity) => {
    const tab = root.windowService.getOrCreateCurrentTab()
    tab.addEntityPage(entity.id)
  } 
  
  return (
    <div className="w-full h-full">
      <div className="flex w-full justify-center py-3 gap-2">
        <Button onClick={() => setActive('file_tree')} isActive={active === 'file_tree'}>
          <FolderTreeIcon />
        </Button>
        <Button onClick={() => setActive('file_list')} isActive={active === 'file_list'}>
          <ListIcon />
        </Button>
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
}