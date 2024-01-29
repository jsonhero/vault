import { QueryManager, queryManager } from "~/query-manager";

import { WindowService } from './window.service'
import { createContext, useContext } from "react";
// https://dev.to/ivandotv/mobx-root-store-pattern-with-react-hooks-318d
export class RootService {

  windowService: WindowService
  constructor(
    private readonly manager: QueryManager
  ) {
    this.windowService = new WindowService(manager)
  }  
}

const rootContext = createContext<RootService>(null)

export const rootService = new RootService(queryManager)

export const useRootService = () => useContext(rootContext)

export const RootServiceProvider = ({ children }) => {
  return (
    <rootContext.Provider value={rootService}>
      {children}
    </rootContext.Provider>
  )
}

