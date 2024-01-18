import { FilePlus, Table } from "lucide-react"

import { useAppStateService } from "~/features/app-state"
import { entityService } from "~/services/entity.service"

export const IconBar = () => {
  const appState = useAppStateService()

  const onClickAddDocument = async () => {
    const entity = await entityService.insertDocument()
    appState.setSelectedEntityId(entity.id)
  }

  const onClickAddTable = async () => {
    const entity = await entityService.insertTable()
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