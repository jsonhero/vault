import { makeAutoObservable } from "mobx";

interface ModalOpenProps {
  entityId: number;
}

export class ModalService {
  selectedEntityId: number | null = null
  isOpen: boolean;

  constructor() {
    makeAutoObservable(this)
    this.isOpen = false
  }

  close() {
    this.isOpen = false
    this.selectedEntityId = null
  }

  open(props?: ModalOpenProps) {
    this.isOpen = true
    if (props) {
      this.selectedEntityId = props.entityId
    }
  }

  toggle(open: boolean) {
    if (open) {
      this.open()
    } else {
      this.close()
    }
  }  

}