import { NodeType, Node as ProseMirrorNode } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import { liftTarget } from "prosemirror-transform";
import { EditorView } from "prosemirror-view";
import { Editor, Node } from "~/lib/vault-prosemirror";
import { rootService } from "~/services/root.service";

export class HashtagNodeView {
  dom;
  contentDOM;
  node;
  view;
  getPos;

  constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) {
    this.view = view;
    this.getPos = getPos
    const button = document.createElement('button')

    button.onclick = () => {
      const tag = this.node.textContent.slice(1)
      rootService.windowService.addTab({
        type: 'hashtag_view',
        meta: {
          tag,
        },
        name: '#' + tag,
      })
    }
    this.dom = this.contentDOM = button
    this.dom.className = "text-green-500"
    this.node = node;
  }

  update(node: ProseMirrorNode) {
    this.node = node
    return true
  }
}

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

function isInHashtag(
  state: EditorState
) {
  const { nodes } = state.schema;

  if (nodes.hashtag && isNodeSelected(nodes.hashtag, state)) {
    return true
  }

  return false
}

export const HashtagNode = Node.create({
  name: 'hashtag',
  spec() {
    return {
      inline: true,
      group: 'inline',
      content: 'text*',
      parseDOM: [
        { tag: 'hashtag' }
      ],
    }
  },
  nodeView(props) {
    return new HashtagNodeView(props.node, props.view, props.getPos)
  },
  keymap({ type }) {
    return {
      Enter: (state, dispatch) => {
        console.log('enter it')
        if (!isInHashtag(state)) {
          return false
        }

        // const { selection } = state
        if (dispatch) {
          dispatch(liftTextAfterSelection(state))
        }

        // const text = selection.$anchor.nodeBefore?.text;

        // const offset = selection.$from.nodeAfter?.nodeSize

        // if (offset) {
        //   const $end = state.doc.resolve(selection.from + 1)

        //   const range = selection.$from.blockRange($end)
          

        //   if (range && dispatch) {
        
        //     dispatch(state.tr.lift(range, 2))
        //   }
        // }
        // liftTarget()

        // state.tr.lift()

        // state.tr.setTime()

        return false

      }
    }
  },
})