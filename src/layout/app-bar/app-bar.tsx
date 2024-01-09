import { PanelLeft, PanelRight, Search } from 'lucide-react'
import { useAppStateService } from '~/features/app-state'
import { useSearchService } from '~/features/search'

export const AppBar = () => {

  const search = useSearchService()
  const appState = useAppStateService()

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

  return (
    <div className="flex items-center text-secondary h-full">
      <div className="w-[40px] flex items-center justify-center">
        <button onClick={onClickPanelLeft}>
          <PanelLeft size={16} />
        </button>
      </div>
      <div className="w-[275px] flex items-center px-1">
        <button onClick={openSearch}>
          <Search size={16} />
        </button>
      </div>
      <div className="flex-1 w-auto">
      </div>
      <div className="w-[370px] flex items-center justify-end pr-4">
        <button onClick={onClickPanelRight}>
          <PanelRight size={16} />
        </button>
      </div>
    </div>
  )
}