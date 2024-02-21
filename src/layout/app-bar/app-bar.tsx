import { PanelLeftIcon, PanelRightIcon, SearchIcon, XIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useAppStateService } from '~/features/app-state'
import { useSearchService } from '~/features/search'
import { WindowTab } from "~/services/window.service"
import { useRootService } from "~/services/root.service"
import { observer } from 'mobx-react-lite'

const WindowTabComponent = ({ tab, onClickTab, onCloseTab, isActive }: { tab: WindowTab }) => {
  return (
    <Button data-active={isActive} isActive={isActive} onClick={() => onClickTab(tab)} className="flex justify-between items-center group p-3 w-[160px] h-full border-r border-backgroundBorder first:border-l data-[active=true]:bg-primary">
      <div className="text-sm">
        {tab.name}
      </div>
      <div onClick={(e) => {
          e.stopPropagation();
          onCloseTab(tab);
      }} className="w-[14px]">
        <XIcon  className="hidden group-hover:block group-data-[active=true]:block" size={14} />
      </div>
    </Button>
  )
}
export const AppBar = observer(() => {

  const search = useSearchService()
  const appState = useAppStateService()
  const root = useRootService()

  const openSearch = () => {
    search.open({
      onClickResult(entityId) {
        appState.setSelectedEntityId(entityId)
      },
    })
  }

  const onClickPanelLeft = () => {
    appState.toggleLeftBar()
  }

  const onClickPanelRight = () => {
    appState.toggleRightBar()
  }

  const onClickTab = (tab: WindowTab) => {
    root.windowService.setActiveTab(tab.id)
  }

  const onCloseTab = (tab: WindowTab) => {
    root.windowService.removeTab(tab.id)
  }

  console.log(root.windowService.tabs, 'tabs')

  return (
    <div className="flex items-center text-muted h-full">
      <div className="w-[40px] flex items-center justify-center">
        <Button onClick={onClickPanelLeft}>
          <PanelLeftIcon />
        </Button>
      </div>
      <div className="w-[275px] flex items-center px-1">
        <Button onClick={openSearch}>
          <SearchIcon />
        </Button>
      </div>
      <div className="h-full flex flex-1 items-end overflow-x-hidden">
          {root.windowService.tabs.map((t) => 
            <WindowTabComponent key={t.id} isActive={t.id === root.windowService.activeTab?.id} tab={t} onCloseTab={onCloseTab} onClickTab={onClickTab} />)
          }
      </div>
      <div className="w-[170px] flex items-center justify-end pr-4">
        <Button onClick={onClickPanelRight}>
          <PanelRightIcon />
        </Button>
      </div>
    </div>
  )
})