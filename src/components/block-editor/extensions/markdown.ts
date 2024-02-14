import { InputRule, inputRules } from 'prosemirror-inputrules'
import { keymap } from 'prosemirror-keymap';
import { Plugin } from 'prosemirror-state';
import { toggleMark } from 'prosemirror-commands'

import { Extension } from '~/lib/vault-prosemirror'

const headerRule = new InputRule(/^(#+)(\s+)/, (state, match, start, end) => {

  const $start = state.doc.resolve(start)
  
  if ($start.parent.type.name === 'paragraph') {
    const { tr, selection } = state;
    const { $from, $to } = selection;
    const block = $from.blockRange($to);

    console.log(match, 'block')

    const headingLevel = match[1].length
    const heading = state.schema.nodes.heading.create({
      level: headingLevel,
    }, $start.parent.content)

    // return state.tr.replaceWith(block!.start, block!.end, header)

    
    return state.tr.setBlockType(start, end, state.schema.nodes.heading, {
      level: headingLevel
    }).deleteRange(start, end)
  }

  return null
})

const boldRule = new InputRule(/\*\*([^*]+)\*\*/, (state, match, start, end) => {
  return state.tr.addMark(start, end, state.schema.marks.strong.create())
    .insertText(match[1], start, end)
    .removeStoredMark(state.schema.marks.strong)
})

const markdownPlugin: Plugin = new Plugin({
  appendTransaction(transactions, oldState, newState) {
    if (oldState.selection !== newState.selection) {
      const { $from } = newState.selection
      const parent = $from.parent
      if (newState.selection.empty && parent.type.name === 'heading' && parent.textContent.length === 0) {
        
      }

    }
    return null
  },
  props: {
  }
})

export const MarkdownExtension = Extension.create({
  proseMirrorPlugins() {
    return [
      keymap({
        'Mod-b': (state, dispatch) => toggleMark(state.schema.marks.strong)(state, dispatch),
        'Mod-B': (state, dispatch) => toggleMark(state.schema.marks.strong)(state, dispatch),
      }),
      markdownPlugin,
      inputRules({
        rules: [headerRule, boldRule]
      })
    ]
  }
})