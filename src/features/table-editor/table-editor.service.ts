import { sql } from 'kysely'
import { QueryManager } from '~/query-manager'
import { NewEntity } from '~/types/db'
import { nanoid } from 'nanoid'

export class TableEditorService {
  schemaQuery;
  // recordsQuery;
  id;
  constructor(
    private readonly manager: QueryManager
  ) {
    this.id = nanoid()
    this.schemaQuery = this.manager.takeFirstObservableQuery(
      (db, id: number) => db.selectFrom('data_schema')
      .where('id', '=', id)
      .selectAll()
    )

    // this.recordsQuery = this.manager.observableQuery(
    //   (db, dataSchemaId: number) => db.selectFrom('entity')
    //     .where('data_schema_id', '=', dataSchemaId)
    //     .where('type', '=', 'document')
    //     .selectAll()
    // );
  }


  // not acting reactive? https://github.com/mobxjs/mobx/blob/f0e066f427d573cbef4b92f3310eb069c3aca205/packages/mobx-react-lite/src/useObserver.ts#L49-L51
  // https://github.com/lostpebble/pullstate/issues/60#issuecomment-742541725
  insertRow = () => {
    const dataSchema = this.schemaQuery.data

    if (dataSchema) {
      this.manager.db.insertInto('entity').values({
        data_schema_id: dataSchema.id,
        title: '',
        type: 'document',
        data: {
          values: {}
        }
      })
      .returningAll()
      .execute()
    }
  }

  addColumn = () => {
    const dataSchema = this.schemaQuery.data

    if (dataSchema) {
      const schema = { ...dataSchema.schema }
      schema.columns.push({
        id: nanoid(),
        name: 'placeholder',
        type: 'text',
      })

      console.log(schema, 's')

      this.manager.db.updateTable('data_schema')
        .set({
          schema
        })
        .where('id', '=', dataSchema.id)
        .execute()
    }
  }

  updateCell(rowEntityId: number, columnId: string, value: any) {
    const dataSchema = this.schemaQuery.data

    if (dataSchema) {
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
            data: sql`json_set(data, $.${columnId}, ${value}})`
          })
          .where('id', '=', rowEntityId)
          .execute()
      }
    }
  }

  dispose() {
    this.recordsQuery.dispose()
    this.schemaQuery.dispose()
  }
}

