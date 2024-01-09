import { createContext, useContext } from 'react'
import { makeAutoObservable } from 'mobx'

class AppStateService {
  selectedEntityId: number | null;
  isLeftBarExpanded: boolean
  isRightBarExpanded: boolean

  constructor() {
    makeAutoObservable(this)
    this.selectedEntityId = null
    this.isLeftBarExpanded = true
    this.isRightBarExpanded = true
  }

  setSelectedEntityId(id: number) {
    this.selectedEntityId = id
  }

  toggleLeftBar() {
    this.isLeftBarExpanded = !this.isLeftBarExpanded
  }

  toggleRightBar() {
    this.isRightBarExpanded = !this.isRightBarExpanded
  }

}

export const appStateService = new AppStateService()

const appStateContext = createContext<AppStateService>(null)

export const useAppStateService = () => useContext(appStateContext)

export const AppStateProvider = ({ children }) => {
  return (
    <appStateContext.Provider value={appStateService}>
      {children}
    </appStateContext.Provider>
  )
}

