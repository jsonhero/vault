import { useContext, createContext, useState, useCallback } from "react";
import { makeAutoObservable } from 'mobx'

import { Search } from './search.component'


class SearchService {
  isOpen: boolean;
  openProps: SearchOpenProps

  constructor() {
    makeAutoObservable(this)
    this.isOpen = false
    this.openProps = {}
  }

  close() {
    this.isOpen = false
  }

  open(props?: SearchOpenProps) {
    this.isOpen = true
    if (props) {
      this.openProps = props
    }
  }

  toggle(open: boolean) {
    if (open) {
      this.open()
    } else {
      this.close()
    }
  }  
}

export const searchService = new SearchService()

export interface SearchOpenProps {
  onClickResult?: (entityId: number) => void
  entityTypeFilter?: string;
}

export const searchContext = createContext<SearchService>(null)

export const useSearchService = () => useContext(searchContext)

export const SearchProvider = ({ children }) => {
  return (
    <searchContext.Provider value={searchService}>
      <>
        {children}
        <Search />
      </>
    </searchContext.Provider>
  )
}


