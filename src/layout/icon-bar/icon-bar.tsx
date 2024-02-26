import { FilePlusIcon, TableIcon } from "lucide-react"

import { entityService } from "~/services/entity.service"

import { Button } from '~/components/ui/button'
import { useRootService } from "~/services/root.service"

export const IconBar = () => {
  const root = useRootService()

  const onClickAddDocument = async () => {
    const entity = await entityService.insertDocument()

    const tab = root.windowService.getOrCreateCurrentTab()
    tab.addEntityPage(entity.id)
  }

  const onClickAddTable = async () => {
    const entity = await entityService.insertTable()
    const tab = root.windowService.getOrCreateCurrentTab()
    tab.addEntityPage(entity.id)
  }

  return (
    <div className="w-full h-full flex flex-col py-2 items-center text-muted gap-3">
      <Button size="lg" className="w-auto" onClick={onClickAddDocument}>
        <FilePlusIcon />
      </Button>
      <Button size="lg" className="w-auto" onClick={onClickAddTable}>
        <TableIcon />
      </Button>
    </div>
  )
}