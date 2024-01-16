import { QueryManager } from "~/query-manager";

import { EntityService } from './entity.service'

// https://dev.to/ivandotv/mobx-root-store-pattern-with-react-hooks-318d
class RootService {
  constructor(
    private readonly manager: QueryManager
  ) {
    
  }  
}