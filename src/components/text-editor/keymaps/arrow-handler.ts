import { EditorState, TextSelection, Transaction } from "prosemirror-state"
import { EditorView } from "prosemirror-view"

export function arrowHandler(dir: "up" | "down" | "left" | "right" | "forward" | "backward") {
  return (state: EditorState, dispatch: ((tr: Transaction) => void) | undefined, view?: EditorView) => {
    if (state.selection.empty && view?.endOfTextblock(dir)) {
      let side = dir == "left" || dir == "up" ? -1 : 1
      let $head = state.selection.$head
      let nextPos = TextSelection.near(
        state.doc.resolve(side > 0 ? $head.after() : $head.before()), side)
      if (nextPos.$head && nextPos.$head.parent.type.name == "codemirror") {
        if (dispatch) {
          dispatch(state.tr.setSelection(nextPos))
        }
        return true
      }
    }
    return false
  }
}


