import { InputRule } from "prosemirror-inputrules";
import { MarkType, NodeType, Node as ProseMirrorNode } from "prosemirror-model";
import { EditorState, Plugin, TextSelection } from "prosemirror-state";
import { liftTarget } from "prosemirror-transform";
import { EditorView } from "prosemirror-view";
import { Editor, Mark, Node } from "~/lib/vault-prosemirror";
import { rootService } from "~/services/root.service";
import { getMarkRange } from "../utils/get-mark-range";

function liftTextAfterSelection(state: EditorState) {
  const { doc, selection, schema } = state
  const { from, to, $from } = selection;

  let tr = state.tr

  if (!$from.nodeAfter || !$from.nodeAfter.isText) {
    // If the node after selection is not text, return early
    return tr;
  }

  // Calculate the range of text after the selection
  const textAfterSelection = selection.$from.nodeAfter?.text || ''
  
  // Create a new text node containing the text after the selection
  const liftedTextNode = schema.text(textAfterSelection);

  const offset = $from.nodeAfter?.nodeSize

  const end = from + offset

  // Delete the text after the selection
  tr = tr.delete(from, end);


  const mapped = tr.mapping.map(end + 1)
  // Insert the new text node into the parent paragraph node
  tr = tr.insert(mapped, liftedTextNode);

  // tr = tr.setSelection(TextSelection.create(tr.doc, mapped + 1))

  // const last = tr.mapping.map(end + 1)

  // tr.setSelection(TextSelection.create(tr.doc, last))


  return tr;
}

function isNodeSelected(
  type: NodeType,
  state: EditorState,
) {
  const nodeAfter = state.selection.$from.nodeAfter
  const node = nodeAfter?.type === type ? nodeAfter : undefined;

  if (!node) {
    return state.selection.$from.parent.type === type
  }

  return false
}

const isMarkSelected =
  (type: MarkType) =>
  (state: EditorState): boolean => {
    if (!type) {
      return false;
    }

    const { from, $from, to, empty } = state.selection;

    return !!(empty
      ? type.isInSet(state.storedMarks || $from.marks())
      : state.doc.rangeHasMark(from, to, type));
  };



function isInHashtag(
  state: EditorState
) {
  const { nodes } = state.schema;

  if (nodes.hashtag && isNodeSelected(nodes.hashtag, state)) {
    return true
  }

  return false
}

export const HashtagMark = Mark.create({
  name: 'hashtag',
  spec() {
    return {
      parseDOM: [
        { tag: 'span' },
        { class: 'text-green-500 cursor-pointer' }
      ],
      toDOM: (node) => [
        'span',
        {
          class: 'text-green-500 cursor-pointer'
        }
      ]
    }
  },
  proseMirrorPlugins({ type }) {

    const plugin = new Plugin({
      props: {
        handleTextInput(view, from, to, text) {
          const { state } = view

          if (state.selection.empty) {
            const marks = state.doc.nodeAt(view.state.selection.from - 1)?.marks
            if (marks?.find((mark) => mark.type === type)) {
              view.dispatch(state.tr.setStoredMarks(marks))
            }
          }
        },
        handleKeyDown(view, event) {
          const { state } = view

          if (state.tr.storedMarks?.find((mark) => mark.type === type)) {
            return false;
          }

          if (event.key === ' ' || event.key === 'Spacebar') {
            const range = getMarkRange(state.selection.$from, type)

            let tr = view.state.tr

            if (range) {
              tr = tr.removeMark(tr.selection.from, range.to, type)
            }
            
            tr = tr.removeStoredMark(type)
            tr = tr.insertText(' ', tr.selection.from)
            view.dispatch(tr)      
            return true
          }

          return false
        },
      }
    })
    return [plugin]
  },
  inputRules({ type }) {
    return [
      new InputRule(/(?:^|\s)(#[a-zA-Z0-9])$/, (state, match, start, end) => {
        if (state.tr.storedMarks?.find((mark) => mark.type === type)) {
          return null
        }
      
        let tr = state.tr
        const markStart = match[0].startsWith(' ') ? start + 1 : start
        tr = tr.insertText(match[1][match[1].length - 1], end).scrollIntoView()
        tr = tr.addMark(markStart, tr.mapping.map(end), state.schema.marks.hashtag.create())
      
        // tr = openSuggestion(nodeSuggestionKey, state, tr, '#', {
        //   from: tr.mapping.map(start),
        //   to: tr.mapping.map(end)
        // })
    
        return tr
      })
    ]
  },
  keymap({ type }) {
    return {
      Enter: (state, dispatch) => {
        if (!isMarkSelected(type)(state)) {
          return false
        }

        const { selection } = state
        const offset = selection.$from.nodeAfter?.nodeSize

        console.log(offset, 'offset?!')

        if (offset) {
          if (dispatch) {
            dispatch(state.tr.removeMark(selection.from, selection.from + offset))
            return false
          }
        }
        
        return false

      }
    }
  },
})