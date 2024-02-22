import { makeAutoObservable, reaction } from 'mobx'
import { nanoid } from 'nanoid'

import { RootService } from './root.service';
import { entityService } from './entity.service';

class Page {
  id: string;
  constructor() {
    makeAutoObservable(this)
    this.id = nanoid()
  }
}

export class HashtagPage extends Page {
  tag: string;
  constructor(tag: string) {
    super()
    makeAutoObservable(this)
    this.tag = tag
  }
}

export class EntityPage extends Page {
  entityId: number;
  selectedBlockId?: string | null;
  constructor(entityId: number, selectedBlockId?: string | null) {
    super()
    makeAutoObservable(this)
    this.entityId = entityId
    this.selectedBlockId = selectedBlockId
  }
}

export class Tab {
  id: string;
  title: string;
  pages: Page[];
  currentPageIndex = -1;

  constructor() {
    makeAutoObservable(this)
    this.id = nanoid()
    this.title = 'Untitled'
    this.pages = []
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

  async goToPage(index: number) {
    if (index >= 0 && index < this.pages.length) {

      const page = this.getPage(index)

      if (page instanceof EntityPage) {
        this.title = (await entityService.findById(page.entityId)).title
      } else if (page instanceof HashtagPage) {
        this.title = page.tag
      }
      this.currentPageIndex = index;
    }
  }

  getPage(index: number) {
    return this.pages[index]
  }

  goBack() {
    if (this.currentPageIndex > 0) {
      this.goToPage(this.currentPageIndex--)
    }
  }

  goForward() {
    if (this.currentPageIndex < this.pages.length - 1) {
      this.goToPage(this.currentPageIndex++)
    }
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
      this.tabs = state.data.tabs
      this.currentTabId = state.data.currentTabId
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


  private save() {
    this.root.db.updateTable('app_state')
      .where('type', '=', 'window_state')
      .set({
        data: {
          tabs: this.tabs,
          currentTabId: this.currentTabId,
        }
      })
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
    const tab = new Tab()
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
