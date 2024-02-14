import { InputRule } from "prosemirror-inputrules";
import { MarkType, Mark } from "prosemirror-model";
import { EditorState } from "prosemirror-state";


export function markInputRule(regexp: RegExp, markType: MarkType) {
  return new InputRule(regexp, (state, match, start, end) => {
    return state.tr.addMark(start, end, markType.create())
      .insertText(match[1], start, end)
      .removeStoredMark(state.schema.marks.strong)
  })
}