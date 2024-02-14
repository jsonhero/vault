import { makeAutoObservable, reaction } from 'mobx'
import { nanoid } from 'nanoid'
import { createContext } from 'react';
import { QueryManager, queryManager } from '~/query-manager'
import { RootService } from './root.service';


type BaseWindowTab = {
  id: string;
  isActive: boolean;
  name: string;
}

type HashtagViewWindowTab = BaseWindowTab & {
  type: 'hashtag_view';
  meta: {
    tag: string
  }
}

type EntityViewWindowTab = BaseWindowTab & {
  type: 'entity_view';
  meta: {
    entityId: number;
    selectedBlockId?: string | null
  }
}

export type WindowTab = HashtagViewWindowTab | EntityViewWindowTab

type Window = {
  id: string;
  tabs: WindowTab[];
}


export class WindowService {
  // activeTab?: WindowTab
  tabs: WindowTab[] = []
  constructor(
    private readonly root: RootService
  ) {
    makeAutoObservable(this, {
      tabs: true,
      activeTab: true,
    })

    reaction(() => this.tabs, () => {
      this.save()
    })
    // reaction(() => this.activeTab, () => {
    //   this.save()
    // })
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
      // this.activeTab = state.data.activeTab
    }
  }

  private insertInitial() {
    this.root.db.insertInto('app_state').values({
      type: 'window_state',
      data: {
        tabs: [],
        // activeTab: undefined,
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
          // activeTab: this.activeTab,
        }
      })
      .execute()
  }

  setActiveTab(tabId: string) {
    this.tabs = this.tabs.map((t) => {
      if (t.id === tabId) {
        return {
          ...t,
          isActive: true
        }
      } else if (t.isActive) {
        return {
          ...t,
          isActive: false,
        }
      }
      return t
    })
  }

  get activeTab() {
    return this.tabs.find((t) => t.isActive)
  }



  addTab(tab: Omit<WindowTab, 'id'>) {
    const id = nanoid()
    this.tabs = [...this.tabs, { id, ...tab, }]
    this.setActiveTab(id)
  }

  updateEntityTabName(entityId: number, name: string) {
    this.tabs = this.tabs.map((t) => {
      if (t.type === 'entity_view' && t.meta.entityId === entityId) {
        return {
          ...t,
          name,
        }
      }
      return t
    })
  }

  updateTabSelectedBlock(tabId: string, selectedBlockId: string | null) {
    this.tabs = this.tabs.map((t) => {
      if (t.type === 'entity_view' && t.id === tabId) {
        return {
          ...t,
          meta: {
            ...t.meta,
            selectedBlockId,
          },
        }
      }
      return t
    })
  }

  removeTab(tabId: string) {
    if (this.activeTab?.id === tabId) {
      const tab = this.tabs.find((t) => t.id !== tabId)

      if (tab) {
        this.setActiveTab(tab.id)
      }
    }
    
    this.tabs = this.tabs.filter((t) => t.id !== tabId)

  }
}
