import { CtxAsync, useCachedState, useSync } from "@vlcn.io/react";

import SyncWorker from "./sync-worker.js?worker";
import { useState } from "react";
import { nanoid } from 'nanoid'

import { Table } from '~/features/table'
import { DocumentEditor } from '~/features/document-editor'
import { useDatabase, useQuery } from '~/context/database-context'
import { Entity, DataSchema } from '~/types/db-types'
import { Search } from "~/features/search";

function getEndpoint() {
  let proto = "ws:";
  const host = window.location.host;
  if (window.location.protocol === "https:") {
    proto = "wss:";
  }

  return `${proto}//${host}/sync`;
}

const worker = new SyncWorker();


function App({ dbname }: { dbname: string }) {

  const [selectedEntity, setSelectedEntity] = useState<Entity | undefined>()
  const db = useDatabase()

  useSync({
    dbname,
    endpoint: getEndpoint(),
    room: dbname,
    worker,
  });

  const data = useQuery<Entity[]>(
    "SELECT * FROM entity WHERE type IN ('table', 'document') ORDER BY created_at DESC"
  ).data;

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
    setSelectedEntity(entity);
  }

  const onClickAddDocument = async () => {
    const entity = await db.execute<Entity>(`INSERT INTO entity (title, type) VALUES ('Placeholder', 'document') RETURNING *`, [], {
      takeFirst: true,
    })
    await db.execute(`INSERT INTO document (entity_id) VALUES (?) RETURNING *`, [entity.id])

    setSelectedEntity(entity);
  }

  const onSelectTable = (entity: Entity) => {
    setSelectedEntity(entity)
  }

  return (
    <div className="font-sans bg-gray-100 flex h-screen">
      {/* Sidebar */}
      <div className="w-[300px] bg-gray-800 text-white p-4">
        {/* Sidebar content goes here */}
        <h2 className="text-2xl font-semibold mb-4">Vault</h2>
        <Search setSelectedEntity={setSelectedEntity} />
        <div className="flex justify-between">
          <button onClick={onClickAddDocument}>
            Add Document
          </button>
          <button onClick={onClickAddTable}>
            Add Table
          </button>
        </div>
        <div>
          {data.map((d) => (<button className="w-full"  key={d.id} onClick={() => onSelectTable(d)}>{`${d.id}:${d.type}`}</button>))}
        </div>
      </div>
      {/* Main Content: causes flash right now when entity is null.. */}
      <div className="flex-1 p-8 bg-gray-400">
        {selectedEntity?.type === 'table' && <Table tableId={selectedEntity.id} />}
        {selectedEntity?.type === 'document' && <DocumentEditor entityDocId={selectedEntity.id} />}
      </div>
    </div>
  );
}

function EditableItem({
  ctx,
  id,
  value,
}: {
  ctx: CtxAsync;
  id: string;
  value: string;
}) {
  // Generally you will not need to use `useCachedState`. It is only required for highly interactive components
  // that write to the database on every interaction (e.g., keystroke or drag) or in cases where you want
  // to de-bounce your writes to the DB.
  //
  // `useCachedState` will never be required once when one of the following is true:
  // a. We complete the synchronous Reactive SQL layer (SQLiteRX)
  // b. We figure out how to get SQLite-WASM to do a write + read round-trip in a single event loop tick
  const [cachedValue, setCachedValue] = useCachedState(value);
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setCachedValue(e.target.value);
    // You could de-bounce your write to the DB here if so desired.
    return ctx.db.exec("UPDATE test SET name = ? WHERE id = ?;", [
      e.target.value,
      id,
    ]);

  };

  return <input type="text" value={cachedValue} onChange={onChange} />;
}

export default App;

// const nanoid = (t = 21) =>
//   crypto
//     .getRandomValues(new Uint8Array(t))
//     .reduce(
//       (t, e) =>
//         (t +=
//           (e &= 63) < 36
//             ? e.toString(36)
//             : e < 62
//             ? (e - 26).toString(36).toUpperCase()
//             : e > 62
//             ? "-"
//             : "_"),
//       ""
//     );
