import { QueryManager, queryManager } from '../query-manager'

export class EntityGraphService {
  constructor(
    private readonly manager: QueryManager
  ) {}

  addEdge(fromEntityId: number, toEntityId: number, type?: string) {
    this.manager.db.insertInto('entity_graph')
      .values({
        entity_id: fromEntityId,
        to_entity_id: toEntityId,
        type,
      })
      .returningAll()
      .execute()
  }

  async replaceEdges(fromEntityId: number, edges: {
    toEntityId: number,
    type: string,
    data: any
  }[]) {
    await this.manager.db.deleteFrom('entity_graph').where('entity_id', '=', fromEntityId).execute()
    await this.manager.db.insertInto('entity_graph')
      .values(edges.map((e) => ({
        entity_id: fromEntityId,
        to_entity_id: e.toEntityId,
        type: e.type,
        data: e.data,
      })))
      .returningAll()
      .execute()
  }
}

export const entityGraphService = new EntityGraphService(queryManager)
