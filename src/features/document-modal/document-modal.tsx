import { Dialog, Portal } from "@ark-ui/react"
import { observer } from 'mobx-react-lite'
import { EntityEditor } from "../entity-editor"
import { useRootService } from "~/services/root.service"

export const DocumentModal = observer(() => {
  const { modalService } = useRootService()

  return (
    <Dialog.Root open={modalService.isOpen} onOpenChange={(e) => modalService.toggle(e.open)}>
      <Portal>
        <Dialog.Backdrop className="absolute top-0 left-0 w-full h-full  z-50" style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(3px)'
        }}/>
        <Dialog.Positioner className="fixed flex justify-center left-0 top-0 overflow-auto w-screen h-dvh z-50">
          <Dialog.Content className="relative bg-secondary mt-[100px] w-[900px] p-8 text-white">
            <div>
              {modalService.selectedEntityId && <EntityEditor entityId={modalService.selectedEntityId} />}
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})