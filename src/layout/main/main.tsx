import { XIcon } from "lucide-react"
import { observer } from "mobx-react-lite"
import { useMemo } from "react"
import { useAppStateService } from "~/features/app-state"
import { EntityEditor } from "~/features/entity-editor"
import { TagView } from "~/features/tag-view"
import { useRootService } from "~/services/root.service"
import { WindowTab } from "~/services/window.service"

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

  return (
    <div>
      <div className="h-[40px] border-b-1 border-gray-700">
        <div className="flex items-center h-full">
          {root.windowService.tabs.map((t) => 
            <WindowTabComponent key={t.id} isActive={t.id === root.windowService.activeTab?.id} tab={t} onCloseTab={onCloseTab} onClickTab={onClickTab} />)
          }
        </div>
      </div>
      <div className="w-auto h-full p-10">
        {root.windowService.activeTab?.type === 'entity_view' && <EntityEditor entityId={root.windowService.activeTab.meta.entityId} />}
        {root.windowService.activeTab?.type === 'hashtag_view' && <TagView tag={root.windowService.activeTab.meta.tag} />}
      </div>
    </div>
  )
})