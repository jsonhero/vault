import { observer } from "mobx-react-lite"
import { useAppStateService } from "~/features/app-state"
import { EntityEditor } from "~/features/entity-editor"

export const Main = observer(() => {
  const appState = useAppStateService()

  return (
    <div>
      {/* <div className="h-[40px] bg-red-400">

      </div> */}
      <div className="w-auto h-full p-10">
        {appState.selectedEntityId && <EntityEditor entityId={appState.selectedEntityId}/>}
      </div>
    </div>
  )
})