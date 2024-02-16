import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { Extension } from '~/lib/vault-prosemirror'

const placeholderPlugin = new Plugin({
  state: {
    init() {
      return {
        decorations: DecorationSet.empty
      }
    },
    apply(tr, state) {

      const { $from, from } = tr.selection
      
      const node = $from.parent

      if (node.isTextblock && node.textContent.length === 0) {

        const dec = Decoration.node(from - 1, from + 1, {
          class: 'empty'
        })

        return {
          decorations: DecorationSet.create(tr.doc, [dec])
        }
      } else if (state.decorations) {
        return {
          decorations: DecorationSet.empty
        }
      }

      return state
    },
  },
  props: {
    decorations: (state) => placeholderPlugin.getState(state)?.decorations,
  }
})

export const PlaceholderExtension = Extension.create({
  name: 'placeholder',
  proseMirrorPlugins() {
    return [placeholderPlugin]
  },
})

/**
 * Decorations for hashtags?
 * 
 * 
 */