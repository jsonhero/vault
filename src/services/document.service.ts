import { QueryManager, queryManager } from '../query-manager'

export class DocumentService {
  constructor(
    private readonly manager: QueryManager
  ) {}

  findById(id: number) {
    return this.manager.db.selectFrom('document')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirstOrThrow()
  }

  update(id: number, doc: object, docText: string) {
    return this.manager.db.updateTable('document')
      .set({
        doc,
        doc_text: docText,
      })
      .where('id', '=', id)
      .returningAll()
      .execute()
  }

  insert(entityId: number, doc?: object, docText?: string) {
    return this.manager.db.insertInto('document')
      .values({
        entity_id: entityId,
        doc,
        doc_text: docText,
      })
      .returningAll()
      .execute()
  }
}

export const documentService = new DocumentService(queryManager)
