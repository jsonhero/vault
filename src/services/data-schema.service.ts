import { nanoid } from 'nanoid'

import { QueryManager, queryManager } from '../query-manager'

export class DataSchemaService {
  constructor(
    private readonly manager: QueryManager
  ) {}

  findById(id: number) {
    return this.manager.db.selectFrom('data_schema')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirstOrThrow()
  }

  update(id: number, schema: object) {
    return this.manager.db.updateTable('data_schema')
      .where('id', '=', id)
      .set({
        schema: schema as any, 
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  insert(schema?: any) {
    if (schema) {
      schema.columns = schema.columns.map((col) => {
        return {
          id: nanoid(),
          ...col,
        }
      })
    }

    const defaultSchema = {
      columns: [
        {
          id: nanoid(),
          type: 'title',
          name: 'Name'
        }
      ]
    }

    return this.manager.db.insertInto('data_schema')
      .values({
        schema: schema || defaultSchema,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }
}

export const dataSchemaService = new DataSchemaService(queryManager)
