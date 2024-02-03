import { keymap } from "prosemirror-keymap";
import { EditorState, TextSelection, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "../schema";
import { joinTextblockBackward } from "prosemirror-commands";
import { generateBlockId } from "../utils";

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

const createLineblockOnEnter = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
  const { $from, $to } = state.selection;

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
            blockId: generateBlockId(),
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
    // @ts-ignore
    const tr = state.tr.split($from.pos).setBlockType($from.pos + 1, $from.pos + 1, schema.nodes.lineblock.create({
      blockId: generateBlockId(),
    }), [
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


export const keymapPlugin = keymap({
  Tab: (state, dispatch) => {
    const before = state.selection.$anchor.before(1)
    const lineblock = state.doc.nodeAt(before)

    const previousLineblock = state.doc.childBefore(before)
    const depth = lineblock?.attrs.depth

    if (
      previousLineblock.node &&
      previousLineblock.node.attrs.depth === depth ||
      previousLineblock.node?.attrs.depth > depth  
    ) {

      const tr = state.tr.setNodeAttribute(before, 'depth', depth + 1)

      if (dispatch) {
        dispatch(tr)
      }
    }

    return true
  },
  "Shift-Tab": (state, dispatch) => {
    const before = state.selection.$anchor.before(1)
    const lineblock = state.doc.nodeAt(before)
  
    const depth = lineblock?.attrs.depth

    if (depth > 0) {
      let tr = state.tr.setNodeAttribute(before, 'depth', lineblock?.attrs.depth - 1)

      // eslint-disable-next-line no-inner-declarations
      function recurseChildren(pos: number) {
        const nextLineblock = state.doc.nodeAt(pos)

        if (nextLineblock) {
          const nextDepth = nextLineblock.attrs.depth
          if (nextDepth > depth) {
            tr = tr.setNodeAttribute(pos, 'depth', nextDepth - 1)
            recurseChildren(pos + nextLineblock.nodeSize)
          }
        }
      }
      recurseChildren(state.selection.$anchor.after(1))

      if (dispatch) {
        dispatch(tr)
      }
    }
    return true
  },
  Enter: createLineblockOnEnter,
  Backspace: backspace,
  ArrowLeft: arrowHandler("left"),
  ArrowRight: arrowHandler("right"),
  ArrowUp: arrowHandler("up"),
  ArrowDown: arrowHandler("down")
});