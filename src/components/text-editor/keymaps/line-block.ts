import { EditorState, Transaction } from "prosemirror-state";
import { joinTextblockBackward } from 'prosemirror-commands'

import { schema } from "../schema";

export const createLineblockOnEnter = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
  const { $from, $to } = state.selection;

  // Check if the cursor is at the end of a "paragraph" within a "lineblock"
  if (
    $from.parent.type.name === "paragraph" &&
    $from.node($from.depth - 1).type.name === "lineblock" &&
    $from.pos === $to.pos
  ) {
    const to = $to.pos;
    const tr = state.tr
      .split(to, 2)
      dispatch?.(tr);
      return true;
  }

  // Check if the cursor is inside a "lineblock", create a new "lineblock" with a "paragraph" inside it
  if ($from.parent.type.name === "lineblock") {
    // @ts-ignore
    const tr = state.tr.split($from.pos).setBlockType($from.pos + 1, $from.pos + 1, schema.nodes.lineblock.create(), [
      { type: schema.nodes.paragraph },
    ]);
    dispatch?.(tr);
    return true;
  }

  return false;
};

export const backspace = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
  const { $from, $to } = state.selection;
  if (
    $from.parent.type.name === "paragraph" &&
    $from.node($from.depth - 1).type.name === "lineblock" &&
    $from.pos === $to.pos
  ) {
    if ($from.parent.content.size === 0 && $from.pos > 2) {
      const tr = state.tr
        .delete($from.pos - 2, $from.pos + 1)
      dispatch?.(tr);
      return true;
    } else if (joinTextblockBackward(state, dispatch)) {
      return true;
    }

  }

  return false;
}
