import { createContext, useContext } from 'react'
import { makeAutoObservable, observable } from 'mobx'



/*
- Kysely + SQLlite dialect/driver
- React hook bindings to queries
- Mobx + SQLite storage/reactivity 
- Mobx partial update observer (possible, not super easy though, would work better with solid)
- Handle query caching? look at other libraries?
*/

// const queryEngine = createQueryEngine(kysely)


// const {
//   data,
//   isLoading,
//   isFetching,
//   isError,
// } = useLiveQuery((db) => db.kysely, {
//   policy: 'cache-only' | 'compute-only' | 'cache-and-compute'
// })


// const entityCollection = queryEngine.createQueryCollection({
//   getEntities() {},
//   insertEntity() {},
// })




// queryEngine.createObservableQuery() 


// const query = queryEngine.createLiveQuery()

// const { data } = await query()


// class DataObserver {

//   constructor(query: string) {
//     makeAutoObservable(this)

    
//   }
// }

// function getEntities() {
//   const 
// }


class AppStateService {
  selectedEntityId: number | null;
  isLeftBarExpanded: boolean
  isRightBarExpanded: boolean

  constructor() {
    makeAutoObservable(this)
    this.selectedEntityId = null
    this.isLeftBarExpanded = true
    this.isRightBarExpanded = true

    // this.entities = observable(entityStore.getAll())


    // loadInitial() // get from db
    // subscribe() // subscribe to events, when event happens update mobx store value
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

