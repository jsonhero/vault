import { EditorState, Plugin, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

import { useNodeViewContext, useWidgetViewContext, ReactWidgetViewUserOptions, ReactWidgetViewSpec } from '@prosemirror-adapter/react'
import { joinTextblockBackward } from 'prosemirror-commands'




export const hashtagPlugin: Plugin = new Plugin({
  // state: {
  //   init(_, state) {
  //     const decSet = createLineNumberDecorations(state)
  //     return decSet
  //   },
  //   apply(tr, set) { return set.map(tr.mapping, tr.doc) }
  // },
  props: {
    decorations(state) {
      const decorations: Decoration[] = []

      const hashRegex = new RegExp(/(^|\s)#[a-zA-Z0-9]+/g)

      state.doc.descendants((node, pos) => {
        if (node.type.name === 'text') {
          const allHashes = [...node.text!.matchAll(hashRegex)]

          for (const hash of allHashes) {
            const start = pos + hash.index
            const end = start + hash[0].length
            const deco = Decoration.inline(start, end, {
              class: 'text-blue-500 cursor-pointer hover:bg-secondary px-[4px] rounded-md'
            })
            decorations.push(deco)
          }
        }
      })

      return DecorationSet.create(state.doc, decorations)


      // return hashtagPlugin.getState(state)
    }
  }
})
