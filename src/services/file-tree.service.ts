import { QueryManager, queryManager } from '../query-manager'

export class FileTreeService {
  constructor(
    private readonly manager: QueryManager
  ) {}

  get() {
    return this.manager.db.selectFrom('app_state')
      .where('type', '=', 'file_tree')
      .selectAll()
      .executeTakeFirstOrThrow()
  }

  insert(tree: object) {
    return this.manager.db.insertInto('app_state')
      .values({
        type: 'file_tree',
        data: tree,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  update(tree: object) {
    return this.manager.db.updateTable('app_state')
    .set({
      data: tree,
    })
    .where('type', '=', 'file_tree')
    .returningAll()
    .executeTakeFirstOrThrow()
  }
  
}

export const fileTreeService = new FileTreeService(queryManager)
