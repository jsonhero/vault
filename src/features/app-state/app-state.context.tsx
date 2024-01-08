import { createContext, useContext } from 'react'
import { makeAutoObservable } from 'mobx'

class AppStateService {
  selectedEntityId: number | null;

  constructor() {
    makeAutoObservable(this)
    this.selectedEntityId = null
  }

  setSelectedEntityId(id: number) {
    this.selectedEntityId = id
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

