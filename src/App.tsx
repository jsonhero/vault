import { CtxAsync, useCachedState, useSync } from "@vlcn.io/react";

import SyncWorker from "./sync-worker.js?worker";

import { AppBar } from "~/layout/app-bar";
import { IconBar } from "~/layout/icon-bar";
import { ExplorerBar } from "~/layout/explorer-bar";
import { Main } from "~/layout/main";
import { UtilityBar } from "./layout/utility-bar";
import { useAppStateService } from "./features/app-state";
import { observer } from "mobx-react-lite";

function getEndpoint() {
  let proto = "ws:";
  const host = window.location.host;
  if (window.location.protocol === "https:") {
    proto = "wss:";
  }

  return `${proto}//${host}/sync`;
}

const worker = new SyncWorker();


const App = observer(({ dbname }: { dbname: string }) => {
  const appState = useAppStateService()

  useSync({
    dbname,
    endpoint: getEndpoint(),
    room: dbname,
    worker,
  });

  return (
    <div className="primary-grid h-screen text-secondary">
      <div className="header-gi bg-primary">
        <AppBar />
      </div>
      <div className="icon-bar-gi bg-tertiary">
        <IconBar />
      </div>
      <div className="explorer-bar-gi bg-secondary overflow-x-hidden transition-[width] duration-300" style={{
        width: appState.isLeftBarExpanded ? '275px' : '0px'
      }}>
        <ExplorerBar />
      </div>
      <div className="main-gi bg-tertiary">
        <Main />
      </div>
      <div className="utility-gi bg-secondary overflow-x-hidden transition-[width] duration-300" style={{
        width: appState.isRightBarExpanded ? '370px' : '0px'
      }}>
        <UtilityBar />
      </div>
    </div>
  )
})

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
