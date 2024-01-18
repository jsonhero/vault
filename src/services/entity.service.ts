import { QueryManager, queryManager } from '../query-manager'
import { DocumentService, documentService } from './document.service'
import { DataSchemaService, dataSchemaService } from './data-schema.service'

export class EntityService {
  constructor(
    private readonly manager: QueryManager,
    private readonly documentService: DocumentService,
    private readonly dataSchemaService: DataSchemaService
  ) {}

  findById(id: number) {
    return this.manager.db.selectFrom('entity')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirstOrThrow()
  }

  deleteById(id: number) {
    this.manager.db.deleteFrom('entity')
      .where('id', '=', id)
      .execute()
  }

  deleteByIds(ids: number[]) {
    this.manager.db.deleteFrom('entity')
      .where('id', 'in', ids)
      .execute()
  }

  updateTitle(id: number, title: string) {
    this.manager.db.updateTable('entity')
      .set({
        title,
      })
      .where('id', '=', id)
      .execute()
  }

  async insertDocument() {
    const entity = await this.manager.db.insertInto('entity')
      .values({
        title: 'Placeholder',
        type: 'document'
      })
      .returningAll()
      .executeTakeFirstOrThrow()
    await this.documentService.insert(entity.id)
    return entity
  }

  async insertTable() {
    const dataSchema = await this.dataSchemaService.insert()
    
    return this.manager.db.insertInto('entity')
      .values({
        title: 'Placeholder',
        type: 'table',
        data_schema_id: dataSchema.id
      })
      .returningAll()
      .executeTakeFirstOrThrow()

  }
}

export const entityService = new EntityService(queryManager, documentService, dataSchemaService)
