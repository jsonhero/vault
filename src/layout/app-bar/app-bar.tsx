import { PanelLeftIcon, PanelRightIcon, SearchIcon, XIcon, ArrowLeftIcon, ArrowRightIcon, PlusIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useAppStateService } from '~/features/app-state'
import { useSearchService } from '~/features/search'
import { EntityPage, HashtagPage, Tab } from "~/services/window.service"
import { useRootService } from "~/services/root.service"
import { observer } from 'mobx-react-lite'
import { useTakeFirstDbQuery } from '~/query-manager'

const EntityPageTitle = ({ page }: { page: EntityPage }) => {

  const { data } = useTakeFirstDbQuery({
    keys: [page.entityId],
    query: (db) => db.selectFrom('entity')
      .where('id', '=', page.entityId)
      .select(['title']),
    // reactiveRowId: BigInt(page.entityId),
    // reactiveTableName: 'entity',
  })

  return (
    <span>
      {data?.title}
    </span>
  )
} 

const HashtagPageTitle = ({ page }: { page: HashtagPage }) => {
  return (
    <span>
      {page.tag}
    </span>
  )
} 

const WindowTabComponent = ({ tab, currentPage, onClickTab, onCloseTab, isActive }: { tab: Tab }) => {
  return (
    <Button data-active={isActive} isActive={isActive} onClick={() => onClickTab(tab)} className="flex justify-between items-center group p-3 w-[160px] h-full border-r border-backgroundBorder data-[active=true]:bg-primary rounded-none">
      <div className="flex-grow text-left text-sm overflow-hidden text-nowrap text-ellipsis">
        {currentPage instanceof EntityPage && <EntityPageTitle page={currentPage} />}
        {currentPage instanceof HashtagPage && <HashtagPageTitle page={currentPage} />}
        {tab.isEmpty && 'Empty'}
      </div>
      <div onClick={(e) => {
          e.stopPropagation();
          onCloseTab(tab);
      }} className="hover:bg-interactiveHover p-1 rounded-sm flex justify-end">
        <XIcon className="hidden group-hover:block group-data-[active=true]:block" size={14} />
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

  const onClickTab = (tab: Tab) => {
    root.windowService.goToTab(tab.id)
  }

  const onCloseTab = (tab: Tab) => {
    root.windowService.removeTab(tab.id)
  }

  const onAddTab = () => {
    root.windowService.addTab()
  }

  const goBackPage = () => {
    root.windowService.currentTab?.goBack()
  }

  const goForwardPage = () => {
    root.windowService.currentTab?.goForward()
  }

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
        <div className="pl-1 h-full flex items-center w-[80px] gap-2">
          <Button size="lg" onClick={goBackPage} className={
              root.windowService.currentTab?.hasPreviousPage ? 'text-normal' : 'hover:text-muted'
          }>
            <ArrowLeftIcon />
          </Button>
          <Button size="lg" onClick={goForwardPage} className={
            root.windowService.currentTab?.hasNextPage ? 'text-normal' : 'hover:text-muted'
          }>
            <ArrowRightIcon />
          </Button>
        </div>
        <div className="h-full flex flex-1 items-end overflow-x-hidden">
            {root.windowService.tabs.map((t) => 
              <WindowTabComponent key={t.id} isActive={t.id === root.windowService.currentTab?.id} tab={t} currentPage={t.currentPage} onCloseTab={onCloseTab} onClickTab={onClickTab} />)
            }
            <div className='ml-2 h-full flex justify-center items-center'>
              <Button onClick={onAddTab}>
                <PlusIcon />
              </Button>
            </div>
        </div>
      </div>
      <div className="w-[170px] flex items-center justify-end pr-4">
        <Button onClick={onClickPanelRight}>
          <PanelRightIcon />
        </Button>
      </div>
    </div>
  )
})