import { XIcon } from "lucide-react"
import { observer } from "mobx-react-lite"
import { useMemo } from "react"
import { useAppStateService } from "~/features/app-state"
import { EntityEditor } from "~/features/entity-editor"
import { TagView } from "~/features/tag-view"
import { useRootService } from "~/services/root.service"
import { WindowTab } from "~/services/window.service"

import { UtilityBar } from '../utility-bar'

const WindowTabComponent = ({ tab, onClickTab, onCloseTab, isActive }: { tab: WindowTab }) => {
  return (
    <button onClick={() => onClickTab(tab)} className="flex items-center group p-3 gap-3 border-r-1 border-gray-700" style={{
      background: isActive && '#383838'
    }}>
      <div className="text-sm">
        {tab.name}
      </div>
      <div onClick={(e) => {
          e.stopPropagation();
          onCloseTab(tab);
      }} className="w-[14px]">
        <XIcon  className="hidden group-hover:block" size={14} />
      </div>
    </button>
  )
}

export const Main = observer(() => {
  const root = useRootService()

  const onClickTab = (tab: WindowTab) => {
    root.windowService.setActiveTab(tab.id)
  }

  const onCloseTab = (tab: WindowTab) => {
    root.windowService.removeTab(tab.id)
  }

  const onSelectBlockId = (blockId: string | null) => {
    console.log(blockId, ':: blocky')
    const activeTab = root.windowService.activeTab
    if (activeTab) {
      root.windowService.updateTabSelectedBlock(activeTab.id, blockId)
    }
  }

  console.log(root.windowService.activeTab?.meta, 'active')

  return (
    <div className="relative main-grid">
      <div className="h-[40px] border-b-1 border-gray-700">
        <div className="flex items-center">
          {root.windowService.tabs.map((t) => 
            <WindowTabComponent key={t.id} isActive={t.id === root.windowService.activeTab?.id} tab={t} onCloseTab={onCloseTab} onClickTab={onClickTab} />)
          }
        </div>
      </div>
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
      <div className="block">
        <p>Hello, it's mee f<span contentEditable="false" className="ProseMirror-widget">**</span> <strong>est</strong></p>
      </div>
      {/* <div className="absolute top-0 w-full h-[200px] bg-red-500">
        test
      </div> */}
    </div>
  )
})