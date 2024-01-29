import { EditorState, Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { createInputRule, inDecoration, openSuggestion } from './suggestion-plugin'
import { ProseMirrorReactPlugin } from '~/lib/prosemirror-react'
import { InputRule, inputRules, undoInputRule } from "prosemirror-inputrules";
import { NodeRange } from "prosemirror-model";
import { schema } from "../schema";

const nodePluginKey = new PluginKey('suggest-decor')


/**
 * Iterate through doc
 * find all hashtag nodes
 * store hashtag nodes on the doc somewhere with corresponding block id?
 * create app_state for keeping track of created hashtags
 * Or just create a #hashtag page
 * Or query doc info for existing tags
 */


function createHashtagRule() {

  // input rules might not be the move, they seem to block user input if typing too fast...
  return new InputRule(/(?:^|\s)(#[a-zA-Z0-9])$/, (state, match, start, end) => {
    if (inHashtagNode(state)) {
      return null
    }
  
    let tr = state.tr


    const $start = state.doc.resolve(match[0].startsWith(' ') ? start + 1 : start)

    const $end = state.doc.resolve(end)
    const range = new NodeRange($start, $end, $start.depth)

    if (range) {
      tr = tr.wrap(range, [{ type: schema.nodes.hashtag }])
      tr = tr.insertText(match[1][match[1].length - 1], tr.mapping.map(end) - 1).scrollIntoView()
      tr = tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map(end) - 1))
    }

    tr = openSuggestion(state, tr, '#', {
      from: tr.mapping.map(start),
      to: tr.mapping.map(end)
    })

    return tr
  })
}

function inHashtagNode(state: EditorState) {
  return state.selection.$anchor.parent.type.name === 'hashtag'
}

const nodePlugin: Plugin = new Plugin({
  key: nodePluginKey,
  props: {
    handleKeyDown(view, event) {
      if (!inHashtagNode(view.state)) return false
      const node = view.state.selection.$anchor.parent

      // remove hash
      const text = node.textContent.slice(1)

      if (event.key === ' ' || event.key === 'Spacebar') {
        view.dispatch(view.state.tr.insertText(' ', view.state.selection.anchor + 1))
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, view.state.selection.anchor + 2)))        
        return true
      }

      if (text.length === 1 && event.key === 'Backspace') {
        const anchor = view.state.selection.anchor
        view.dispatch(view.state.tr.delete(anchor - 3, anchor))
        view.dispatch(view.state.tr.insertText('#'))
        return true
      }

      const anchor = view.state.selection.anchor
    
      const diff = node.textContent.length - view.state.selection.$anchor.textOffset

      const to = diff + anchor
      const from = anchor - view.state.selection.$anchor.textOffset

      openSuggestion(view.state, view.state.tr, '#', { to, from }, view.dispatch)

      return false
    }
  }
})


export const hashtagPlugin = ProseMirrorReactPlugin.create({
  name: 'hashtagplugin',
  buildPlugin(editor) {
    return [
      nodePlugin,
      inputRules({
        rules: [createHashtagRule()]
      })
    ]
  },
})
