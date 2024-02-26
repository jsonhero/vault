import { makeAutoObservable, reaction, runInAction } from 'mobx'
import { nanoid } from 'nanoid'

import { RootService } from './root.service';

abstract class Page {
  id: string;
  type: string;
  constructor(type: string) {
    // makeAutoObservable(this)
    this.id = nanoid()
    this.type = type;
  }

  abstract toJson(): object;
}

export class HashtagPage extends Page {
  tag: string;
  constructor(tag: string) {
    super('hashtag')
    this.tag = tag
  }

  toJson() {
    return {
      tag: this.tag,
    }
  }
}

export class EntityPage extends Page {
  entityId: number;
  selectedBlockId?: string | null;
  constructor(entityId: number, selectedBlockId?: string | null) {
    super('entity')
    this.entityId = entityId
    this.selectedBlockId = selectedBlockId
  }

  setBlockId(blockId: string | null) {
    this.selectedBlockId = blockId
  }

  toJson() {
    return {
      entityId: this.entityId,
      selectedBlockId: this.selectedBlockId,
    }
  }
}

export class Tab {
  id: string;
  pages: Page[];
  currentPageIndex: number;


  windowService: WindowService
  constructor(
    windowService: WindowService, 
    props?: any
  ) {
    makeAutoObservable(this, {
      id: false,
      windowService: false,
    })
    this.windowService = windowService
    this.id = props?.id ?? nanoid()
    this.pages = props?.pages ?? []
    this.currentPageIndex = props?.currentPageIndex ?? -1

    reaction(() => this.pages, () => {
      this.windowService.save()
    })

    reaction(() => this.currentPageIndex, () => {
      this.windowService.save()
    })
  }

  addHashtagPage(tag: string) {
    const page = new HashtagPage(tag)
    this.addPage(page)
  }

  addEntityPage(entityId: number, selectedBlockId?: string | null) {
    const page = new EntityPage(entityId, selectedBlockId)
    this.addPage(page)
  }

  private addPage(page: Page) {
    this.pages.push(page);
    this.goToPage(this.pages.length - 1);
  }

  get currentPage(): Page | undefined {
    return this.getPage(this.currentPageIndex);
  }

  get hasNextPage(): boolean {
    return this.currentPageIndex < this.pages.length - 1
  }

  get hasPreviousPage(): boolean {
    return this.currentPageIndex !== 0
  }

  async goToPage(index: number) {
    if (index >= 0 && index < this.pages.length) {
      this.currentPageIndex = index;
    }
  }

  getPage(index: number) {
    if (this.pages.length) {
      return this.pages[index]
    }
    return undefined
  }

  goBack() {
    if (this.currentPageIndex > 0) {
      this.goToPage(this.currentPageIndex - 1)
    }
  }

  goForward() {
    if (this.currentPageIndex < this.pages.length - 1) {
      this.goToPage(this.currentPageIndex + 1)
    }
  }

  toJson() {
    return {
      id: this.id,
      currentPageIndex: this.currentPageIndex,
      pages: this.pages.map((page) => {
        return page.toJson()
      })
    }
  }
  

  static fromState(windowService: WindowService, state: any) {
    const pages = state.pages?.length ? state.pages.map((page: any) => {
      if (page.type === 'hashtag') {
        return new HashtagPage(page.tag)
      } else {
        return new EntityPage(page.entityId, page.selectedBlockId)
      }
    }) : []
    return new Tab(windowService, {
      id: state.id,
      currentPageIndex: state.currentPageIndex,
      pages: pages
    })
  }

}

export class WindowService {
  // activeTab?: WindowTab
  tabs: Tab[] = []
  currentTabId?: string = undefined;

  constructor(
    private readonly root: RootService
  ) {
    makeAutoObservable(this, {
      tabs: true,
      currentTabId: true,
    })

    reaction(() => this.tabs, () => {
      this.save()
    })
    reaction(() => this.currentTabId, () => {
      this.save()
    })
  }

  async load() {
    const state = await this.root.db.selectFrom('app_state')
      .where('type', '=', 'window_state')
      .selectAll()
      .executeTakeFirst()

    if (!state) {
      await this.insertInitial()
    } else {
      runInAction(() => {
        this.tabs = JSON.parse(state.data.tabs).map((tab: any) => Tab.fromState(this, tab))
        this.currentTabId = state.data.currentTabId
      })
    }
  }

  private insertInitial() {
    this.root.db.insertInto('app_state').values({
      type: 'window_state',
      data: {
        tabs: [],
        currentTabId: undefined,
      }
    })
    .execute()
  }


  save() {
    const tabsJson = JSON.stringify(this.tabs.map((t) => t.toJson())) 
    this.root.db.updateTable('app_state')
      .where('type', '=', 'window_state')
      .set({
        data: {
          tabs: tabsJson,
          currentTabId: this.currentTabId,
        }
      })
      .returningAll()
      .execute()
  }

  get currentTab(): Tab | undefined {
    return this.tabs.find((tab) => tab.id === this.currentTabId);
  }

  getOrCreateCurrentTab() {
    const tab = this.currentTab
    if (!tab) {
      return this.addTab()
    }
    return tab
  }

  goToTab(tabId: string) {
    this.currentTabId = tabId
  }

  addTab() {
    const tab = new Tab(this)
    this.tabs.push(tab);
    this.currentTabId = tab.id;
    return tab;
  }

  removeTab(tabId: string) {
    this.tabs = this.tabs.filter((tab) => tabId !== tab.id)
    if (this.tabs.length) {
      this.currentTabId = this.tabs[0].id
    } else {
      this.currentTabId = undefined
    }
  }


}
