import { createContext, useContext } from "react";
import { QueryManager, queryManager } from "~/query-manager";

import { ModalService } from './modal.service'
import { WindowService } from './window.service'
import { ExtensionService } from "./extension.service";
import { todoExtension } from "~/extensions/todo";

import { DocumentModal } from '../features/document-modal'

// https://dev.to/ivandotv/mobx-root-store-pattern-with-react-hooks-318d
export class RootService {

  windowService: WindowService
  extensionService: ExtensionService
  modalService: ModalService

  constructor(
    public readonly manager: QueryManager
  ) {
    this.windowService = new WindowService(this)
    this.extensionService = new ExtensionService(this, [todoExtension])
    this.modalService = new ModalService()
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
      <>
        {children}
        <DocumentModal />
      </>
    </rootContext.Provider>
  )
}

