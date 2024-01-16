 
import { QueryManager } from '~/query-manager'

export class EntityService {
  query;
  constructor(
    private readonly manager: QueryManager
  ) {
    this.query = this.manager.observableQuery(
      (db) => db.selectFrom('entity')
        .where('type', 'in', ['table', 'document'])
        .orderBy('updated_at desc')
        .selectAll(),
    )
  }  
}


