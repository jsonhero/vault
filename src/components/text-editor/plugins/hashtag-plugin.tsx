import { Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { createInputRule, inDecoration } from './suggestion-plugin'
import { ProseMirrorReactPlugin } from '~/lib/prosemirror-react'
import { InputRule, inputRules, undoInputRule } from "prosemirror-inputrules";
import { NodeRange } from "prosemirror-model";
import { schema } from "../schema";

const decorationPluginKey = new PluginKey('suggest-decor')

const manifest = {
  taggedBlocks: [] 
}

function createHashtagRule() {
  return new InputRule(/(?:^|\s)(#[a-zA-Z0-9]+)/, (state, match, start, end) => {

    const node = state.selection.$anchor.parent

    console.log(node, 'node?')

    if (node?.type.name === 'hashtag') {
      return null
    }
  
    let tr = state.tr

    const $start = state.doc.resolve(start)

    const $end = state.doc.resolve(end)
    const range = new NodeRange($start, $end, $start.depth)
    // schema.nodes.hashtag.create(null, [schema.text(match[1])])
    // console.log(match, 'match?')
    if (range) {
      tr = tr.wrap(range, [{ type: schema.nodes.hashtag }])
      tr = tr.insertText(match[1][match[1].length - 1], tr.mapping.map(end) - 1).scrollIntoView()
      tr = tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map(end) - 1))
    }
    // tr = state.tr.insertText(match[1][match[1].length - 1], end - 1).scrollIntoView();

    return tr
  })
}

export function removeHashtag(view: EditorView) {
  const plugin = decorationPluginKey.get(view.state) as Plugin;
  const meta = { action: 'remove' };
  const tr = view.state.tr.setMeta(plugin, meta);
  view.dispatch(tr);
  return true;
}

const decoClass = "text-blue-500 cursor-pointer hover:bg-secondary px-[4px] rounded-md"

const decorationPlugin: Plugin = new Plugin({
  key: decorationPluginKey,
  state: {
    init(_, state) {
      const decorations: Decoration[] = []

      const hashRegex = new RegExp(/(?:^|\s)(#[a-zA-Z0-9]+)/g)

      state.doc.descendants((node, pos) => {
        if (node.type.name === 'text') {
          const text = node.text!;
          const matches = Array.from(text.matchAll(hashRegex), match => match[2]);

          for (const hash of matches) {
            const hashIndex = text.indexOf(hash);
            const start = pos + hashIndex;
            const end = start + hash.length;
            const deco = Decoration.inline(start, end, {
              class: decoClass,
            });
            decorations.push(deco);
          }
        }
      })

      return {
        decorations: DecorationSet.create(state.doc, decorations)
      }
    },
    apply(tr, state) { 
      const meta = tr.getMeta(decorationPlugin)

      if (meta?.action === 'add') {
        const { trigger } = meta

        const from = tr.selection.from - trigger.length;
        const to = tr.selection.from;

        const deco = Decoration.inline(from, to, {
          class: decoClass,
        }, {
          inclusiveStart: true,
          inclusiveEnd: true,
        })

        return {
          decorations: state.decorations.map(tr.mapping, tr.doc).add(tr.doc, [deco])
        }
      }

      if (meta?.action === 'remove') {
        const from = tr.selection.from;
        const to = tr.selection.from;

        return {
          decorations: state.decorations.map(tr.mapping, tr.doc).remove(
            state.decorations.find(from, to)
          )
        }
      }


      return {
        decorations: state.decorations.map(tr.mapping, tr.doc)
      }
    }
  },
  props: {
    decorations(state) {
      return decorationPlugin.getState(state)?.decorations
    },

    handleKeyDown(view, event) {
      const { decorations } = decorationPlugin.getState(view.state)

      // inline node, or mark?
    

      if (!inDecoration(view.state.selection, decorations)) return false
      const { selection } = view.state

      const { from, to } = selection

      const [decoration] = decorations.find(from, to)

      // remove hash start
      const text = view.state.doc.textBetween(decoration.from, decoration.to).slice(1)

      if (event.key === ' ' || event.key === 'Spacebar') {
        // view.state.tr.m
        view.state
      }
      
      // if only 1 char left and about to remove it.. maybe move this inside apply?
      if (text.length === 1 && event.key === 'Backspace') {
        undoInputRule(view.state, view.dispatch)
        removeHashtag(view)
        return false
      }


    }
  }
})


export const hashtagPlugin = ProseMirrorReactPlugin.create({
  name: 'hashtagplugin',
  buildPlugin(editor) {
    return [
      // decorationPlugin,
      inputRules({
        rules: [createHashtagRule()]
      })
    ]
  },
})
