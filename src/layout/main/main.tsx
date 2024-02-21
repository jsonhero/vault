import { observer } from "mobx-react-lite"
import { EntityEditor } from "~/features/entity-editor"
import { TagView } from "~/features/tag-view"
import { useRootService } from "~/services/root.service"

import { UtilityBar } from '../utility-bar'


export const Main = observer(() => {
  const root = useRootService()

  const onSelectBlockId = (blockId: string | null) => {
    const activeTab = root.windowService.activeTab
    if (activeTab) {
      root.windowService.updateTabSelectedBlock(activeTab.id, blockId)
    }
  }

  return (
    <div className="relative main-grid">
      {/* <div className="h-[40px] border-b-1 border-gray-700">
        <div className="flex items-center">
          {root.windowService.tabs.map((t) => 
            <WindowTabComponent key={t.id} isActive={t.id === root.windowService.activeTab?.id} tab={t} onCloseTab={onCloseTab} onClickTab={onClickTab} />)
          }
        </div>
      </div> */}
      <div className="w-auto overflow-y-auto ">
        <div className='px-[50px] py-10'>
          {root.windowService.activeTab?.type === 'entity_view' && (
            <EntityEditor 
              entityId={root.windowService.activeTab.meta.entityId} 
              onSelectBlockId={onSelectBlockId}
              selectedBlockId={root.windowService.activeTab.meta.selectedBlockId}
            />
          )}
          {root.windowService.activeTab?.type === 'hashtag_view' && <TagView tag={root.windowService.activeTab.meta.tag} />}
        </div>
      </div>
      <div className="w-full bg-secondary">
        <UtilityBar />
      </div>
    </div>
  )
})