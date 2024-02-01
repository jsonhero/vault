import { sql } from 'kysely'
import { nanoid } from 'nanoid'

import { DataSchemaService, dataSchemaService } from './data-schema.service'
import { QueryManager, queryManager } from '../query-manager'

export class TableEditorService {
  constructor(
    private readonly manager: QueryManager,
    private readonly dataSchemaService: DataSchemaService,
  ) {}

  insertRow = (dataSchemaId: number) => {
    return this.manager.db.insertInto('entity').values({
      data_schema_id: dataSchemaId,
      title: '',
      type: 'document',
      data: {
        values: {}
      }
    })
    .returningAll()
    .executeTakeFirst()
  }

  addColumn = async (dataSchemaId: number) => {
    const dataSchema = await this.dataSchemaService.findById(dataSchemaId)

    const schema = { ...dataSchema.schema }
    schema.columns.push({
      id: nanoid(),
      name: 'placeholder',
      type: 'text',
    })

    this.manager.db.updateTable('data_schema')
      .set({
        schema
      })
      .where('id', '=', dataSchema.id)
      .execute()
  }
  

  async updateCell(dataSchemaId: number, rowEntityId: number, columnId: string, value: any) {
    const dataSchema = await dataSchemaService.findById(dataSchemaId)

    const column = dataSchema.schema.columns.find((column) => column.id === columnId)

    if (column?.type === 'title') {
      this.manager.db.updateTable('entity')
        .set({
          title: value,
        })
        .where('id', '=', rowEntityId)
        .execute()
    } else {
      this.manager.db.updateTable('entity')
        .set({
          data: sql`json_set(data, '$.${sql.raw(columnId)}', ${value})`
        })
        .where('id', '=', rowEntityId)
        .execute()
    }
  
  }

}

export const tableEditorService = new TableEditorService(queryManager, dataSchemaService)