import { EditorState, Transaction } from "prosemirror-state";
import { joinBackward, joinTextblockBackward, liftEmptyBlock } from 'prosemirror-commands'

import { schema } from "../schema";
import { nanoid } from 'nanoid'
import { Node } from "prosemirror-model";

const nodeid = () => nanoid(5)

export const createLineblockOnEnter = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
  const { $from, $to } = state.selection;
  console.log('hit enter...')

  const paragraphPos = $from.before(2)
  const paragraphNode = state.doc.nodeAt(paragraphPos)

  // Check if the cursor is at the end of a "paragraph" within a "lineblock"
  if (
    paragraphNode?.type.name === 'paragraph' &&
    $from.pos === $to.pos
  ) {

    const lineblockPos = $from.before(1)
    const lineblock = state.doc.nodeAt(lineblockPos)

    if (lineblock && lineblock.type.name === 'lineblock') {
      const to = $to.pos;
      const tr = state.tr
        .split(to, 2, [{
          type: schema.nodes.lineblock,
          attrs: {
            blockId: nodeid(),
            blockGroupId: lineblock.attrs.blockGroupId,
            depth: lineblock.attrs.depth
          },
        }])
        dispatch?.(tr);
        return false;
    }

  }

  // Check if the cursor is inside a "lineblock", create a new "lineblock" with a "paragraph" inside it
  if ($from.parent.type.name === "lineblock") {
    console.log('creating line block')
    // @ts-ignore
    const tr = state.tr.split($from.pos).setBlockType($from.pos + 1, $from.pos + 1, schema.nodes.lineblock.create({
      blockId: nodeid(),
    }), [
      { type: schema.nodes.paragraph },
    ]);
    dispatch?.(tr);
    return true;
  }

  return false;
};

function textblockAt(node: Node, side: "start" | "end", only = false) {
  for (let scan: Node | null = node; scan; scan = (side == "start" ? scan.firstChild : scan.lastChild)) {
    if (scan.isTextblock) return true
    if (only && scan.childCount != 1) return false
  }
  return false
}

export const backspace = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
  const { $from, $to } = state.selection;
  if (
    $from.parent.type.name === "paragraph" &&
    $from.node($from.depth - 1).type.name === "lineblock" &&
    $from.pos === $to.pos
  ) {
    if ($from.parent.content.size === 0) {
      joinTextblockBackward(state, dispatch)
      // const tr = state.tr
      //   .delete($from.pos - 2, $from.pos + 1)
      // dispatch?.(tr);
      return true;
    } else if (joinTextblockBackward(state, dispatch)) {
      return true;
    }

  }

  return false;
}
