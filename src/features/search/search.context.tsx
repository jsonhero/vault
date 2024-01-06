import { useContext, createContext, useState, useCallback } from "react";

import { Search } from './search.component'


export interface SearchOpenProps {
  onClickResult?: (entityId: number) => void
  entityTypeFilter?: string;
}

export interface SearchProviderProps {
  isOpen: boolean;
  open: (props?: SearchOpenProps) => void;
  close: () => void;
  toggle: (open: boolean) => void;
}

export const searchContext = createContext<SearchProviderProps>(null)

export const useSearch = () => useContext(searchContext)

export const SearchProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [props, setProps] = useState<SearchOpenProps>({})

  const open = (props?: SearchOpenProps) => {
    setIsOpen(true)
    if (props) {
      setProps(props)
    }
  }

  const close = () => {
    setIsOpen(false)
  }

  const toggle = (toggleOpen: boolean) => {
    if (toggleOpen) {
      open()
    } else {
      close()
    }
  }

  return (
    <searchContext.Provider value={{
      isOpen,
      open,
      close,
      toggle,
    }}>
      <>
        {children}
        <Search open={open} isOpen={isOpen} close={close} toggle={toggle} openProps={props} />
      </>
    </searchContext.Provider>
  )
}


