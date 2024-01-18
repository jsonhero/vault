import { QueryManager, queryManager } from '../query-manager'

export class EntityGraphService {
  constructor(
    private readonly manager: QueryManager
  ) {}

  addEdge(fromEntityId: number, toEntityId: number, category?: string) {
    this.manager.db.insertInto('entity_graph')
      .values({
        entity_id: fromEntityId,
        to_entity_id: toEntityId,
        category,
      })
      .returningAll()
      .execute()
  }
}

export const entityGraphService = new EntityGraphService(queryManager)
