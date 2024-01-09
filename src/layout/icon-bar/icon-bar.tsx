import { FilePlus, Table } from "lucide-react"
import { nanoid } from 'nanoid'

import { useDatabase } from "~/context"
import { useAppStateService } from "~/features/app-state"
import { Entity, DataSchema } from "~/types/db-types"


export const IconBar = () => {
  const db = useDatabase()
  const appState = useAppStateService()

  const onClickAddDocument = async () => {
    const entity = await db.execute<Entity>(`INSERT INTO entity (title, type) VALUES ('Placeholder', 'document') RETURNING *`, [], {
      takeFirst: true,
    })
    await db.execute(`INSERT INTO document (entity_id) VALUES (?) RETURNING *`, [entity.id])

    appState.setSelectedEntityId(entity.id)
  }

  const onClickAddTable = async () => {
    const defaultSchema = {
      columns: [
        {
          id: nanoid(),
          type: 'title',
          name: 'Name'
        }
      ]
    }

    const dataSchema = await db.execute<DataSchema>(`INSERT INTO data_schema (schema) VALUES ('${JSON.stringify(defaultSchema)}') RETURNING *`, [], {
      takeFirst: true,
    });
    const entity = await db.execute<Entity>(`INSERT INTO entity (title, type, data_schema_id) VALUES ('Placeholder', 'table', ${dataSchema.id}) RETURNING *`, [], {
      takeFirst: true,
    })
    appState.setSelectedEntityId(entity.id)
  }

  return (
    <div className="w-full h-full flex flex-col py-2 items-center text-secondary gap-3">
      <button className="w-auto" onClick={onClickAddDocument}>
        <FilePlus size={20} />
      </button>
      <button className="w-auto" onClick={onClickAddTable}>
        <Table size={20} />
      </button>
    </div>
  )
}