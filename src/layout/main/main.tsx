import { observer } from "mobx-react-lite"
import { EntityEditor } from "~/features/entity-editor"
import { TagView } from "~/features/tag-view"
import { useRootService } from "~/services/root.service"

import { UtilityBar } from '../utility-bar'
import { EntityPage, HashtagPage } from "~/services/window.service"


export const Main = observer(() => {
  const root = useRootService()

  const onSelectBlockId = (blockId: string | null) => {
    const tab = root.windowService.currentTab;
    if (tab) {
      if (tab.currentPage instanceof EntityPage) {
        tab.currentPage.setBlockId(blockId)
      }
    }
  }

  const currentPage = root.windowService.currentTab?.currentPage

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
          {currentPage instanceof EntityPage && (
            <EntityEditor 
              entityId={currentPage.entityId} 
              onSelectBlockId={onSelectBlockId}
              selectedBlockId={currentPage.selectedBlockId}
            />
          )}
          {currentPage instanceof HashtagPage && <TagView tag={currentPage.tag} />}
        </div>
      </div>
      <div className="w-full bg-secondary">
        <UtilityBar />
      </div>
    </div>
  )
})