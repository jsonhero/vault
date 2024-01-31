import { QueryManager, queryManager } from "~/query-manager";

import { WindowService } from './window.service'
import { createContext, useContext } from "react";
import { ExtensionService } from "./extension.service";
import { todoExtension } from "~/extensions/todo";

// https://dev.to/ivandotv/mobx-root-store-pattern-with-react-hooks-318d
export class RootService {

  windowService: WindowService
  extensionService: ExtensionService
  constructor(
    public readonly manager: QueryManager
  ) {
    this.windowService = new WindowService(this)
    this.extensionService = new ExtensionService(this, [todoExtension])
  }

  get db() {
    return this.manager.db
  }

  load() {
    this.loadServices()
  }


  // TODO: put in event listener instead
  loadServices() {
    this.windowService.load()
    this.extensionService.load()
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

