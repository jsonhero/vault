import { javascript, javascriptLanguage, scopeCompletionSource } from "@codemirror/lang-javascript";
import { Command, Selection, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { ContentMatch, Node as PMNode } from 'prosemirror-model'
import { EditorView as CodeMirrorView, keymap as cmKeymap, drawSelection, ViewUpdate } from '@codemirror/view'
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language"
// import { exitCode } from 'prosemirror-commands'
import { defaultKeymap } from "@codemirror/commands"
import { autocompletion } from '@codemirror/autocomplete'

import { schema } from "../schema";

function defaultBlockAt(match: ContentMatch) {
  for (let i = 0; i < match.edgeCount; i++) {
    let {type} = match.edge(i)
    if (type.isTextblock && !type.hasRequiredAttrs()) return type
  }
  return null
}


const exitCode: Command = (state, dispatch) => {
  let {$head, $anchor} = state.selection
  if (!$head.parent.type.spec.code || !$head.sameParent($anchor)) return false
  let above = $head.node(-2), after = $head.indexAfter(-2), type = defaultBlockAt(above.contentMatchAt(after))
  if (!type || !above.canReplaceWith(after, after, type)) return false
  if (dispatch) {
    let pos = $head.after() + 2 , tr = state.tr.replaceWith(pos, pos, type.createAndFill()!)
    tr.setSelection(Selection.near(tr.doc.resolve(pos), 1))
    dispatch(tr.scrollIntoView())
  }
  return true
}


export class CodeMirrorNodeView {
  node: PMNode;
  view: EditorView;
  getPos: () => number | undefined;
  cm: CodeMirrorView;
  dom: HTMLElement;
  updating: boolean;

  constructor(node: PMNode, view: EditorView, getPos: () => number | undefined) {
    // Store for later
    this.node = node
    this.view = view
    this.getPos = getPos

    this.cm = new CodeMirrorView({
      doc: this.node.textContent,
      extensions: [
        cmKeymap.of([
          ...this.codeMirrorKeymap(),
          ...defaultKeymap
        ]),
        drawSelection(),
        syntaxHighlighting(defaultHighlightStyle),
        javascript(),
        // atomone,
        javascriptLanguage.data.of({ autocomplete: scopeCompletionSource(globalThis) }),
        autocompletion(),
        CodeMirrorView.updateListener.of(update => this.forwardUpdate(update))
      ]
    })

    // The editor's outer node is our DOM representation
    this.dom = this.cm.dom

    // This flag is used to avoid an update loop between the outer and
    // inner editor
    this.updating = false
  }

  forwardUpdate(update: ViewUpdate) {
    if (this.updating || !this.cm.hasFocus) return
    let nodePos = this.getPos() as number
    let offset = nodePos + 1, {main} = update.state.selection
    let selFrom = offset + main.from, selTo = offset + main.to
    let pmSel = this.view.state.selection
    if (update.docChanged || pmSel.from != selFrom || pmSel.to != selTo) {
      let tr = this.view.state.tr
      update.changes.iterChanges((fromA, toA, fromB, toB, text) => {
        if (text.length)
          tr.replaceWith(offset + fromA, offset + toA,
                          schema.text(text.toString()))
        else
          tr.delete(offset + fromA, offset + toA)
        offset += (toB - fromB) - (toA - fromA)
      })
      tr.setSelection(TextSelection.create(tr.doc, selFrom, selTo))
      this.view.dispatch(tr)
    }
  }

  setSelection(anchor: number, head: number) {
    this.cm.focus()
    this.updating = true
    this.cm.dispatch({ selection: { anchor, head } })
    this.updating = false
  }

  codeMirrorKeymap() {
    let view = this.view
    return [
      {key: "ArrowUp", run: () => this.maybeEscape("line", -1)},
      {key: "ArrowLeft", run: () => this.maybeEscape("char", -1)},
      {key: "ArrowDown", run: () => {
        const escaped = this.maybeEscape("line", 1)
        const { $anchor } = view.state.selection

        if (escaped) {
          console.log('escaped!', exitCode(view.state, view.dispatch))
          
          view.focus()
        }
        return escaped
      }},
      {key: "ArrowRight", run: () => this.maybeEscape("char", 1)},
      {key: "Ctrl-Enter", run: () => {
        let {$head, $anchor} = view.state.selection

        if (!exitCode(view.state, view.dispatch)) {
          return false
        }
        view.focus()
        return true
      }},
      {
        key: 'Backspace',
        run: () => {

          // Delete node if nothing in it
          if (this.cm.state.doc.length === 0) {
            const nodePos = this.getPos() as number
            let tr = this.view.state.tr.delete(nodePos - 2, nodePos + this.node.nodeSize)
            tr.setSelection(TextSelection.create(tr.doc, nodePos - 4, nodePos - 4))
            this.view.dispatch(tr);
            this.view.focus()
            return true
          }
          return false
        }
      }
      // {key: "Ctrl-z", mac: "Cmd-z",
      //   run: () => undo(view.state, view.dispatch)},
      // {key: "Shift-Ctrl-z", mac: "Shift-Cmd-z",
      //   run: () => redo(view.state, view.dispatch)},
      // {key: "Ctrl-y", mac: "Cmd-y",
      //   run: () => redo(view.state, view.dispatch)}
    ]
  }

  maybeEscape(unit: string, dir: number) {
    let { state } = this.cm, { main } = state.selection
    if (!main.empty) return false
    if (unit == "line") main = state.doc.lineAt(main.head)
    if (dir < 0 ? main.from > 0 : main.to < state.doc.length) return false
    let nodePos = this.getPos() as number
    let targetPos = nodePos + (dir < 0 ? 0 : this.node.nodeSize)
    let selection = Selection.near(this.view.state.doc.resolve(targetPos), dir)
    let tr = this.view.state.tr.setSelection(selection).scrollIntoView()
    this.view.dispatch(tr)
    this.view.focus()
    return true
  }
// }
// nodeview_update{
  update(node: PMNode) {
    if (node.type != this.node.type) return false
    this.node = node
    if (this.updating) return true
    let newText = node.textContent, curText = this.cm.state.doc.toString()
    if (newText != curText) {
      let start = 0, curEnd = curText.length, newEnd = newText.length
      while (start < curEnd &&
              curText.charCodeAt(start) == newText.charCodeAt(start)) {
        ++start
      }
      while (curEnd > start && newEnd > start &&
              curText.charCodeAt(curEnd - 1) == newText.charCodeAt(newEnd - 1)) {
        curEnd--
        newEnd--
      }
      this.updating = true
      this.cm.dispatch({
        changes: {
          from: start, to: curEnd,
          insert: newText.slice(start, newEnd)
        }
      })
      this.updating = false
    }
    return true
  }

  selectNode() { this.cm.focus() }
  stopEvent() { return true }
}
