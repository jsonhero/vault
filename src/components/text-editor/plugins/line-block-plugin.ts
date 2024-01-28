import { EditorState, Plugin, PluginKey, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";

import { useNodeViewContext, useWidgetViewContext, ReactWidgetViewUserOptions, ReactWidgetViewSpec } from '@prosemirror-adapter/react'
import { joinTextblockBackward } from 'prosemirror-commands'

import { ProseMirrorReactPlugin } from "~/lib/prosemirror-react";
import { Node } from "prosemirror-model";

const lbPluginKey = new PluginKey('lb-plugin')

export function isBlockHidden(view: EditorView, nodeStart: number, nodeEnd: number) {
  const { decorations } = lbPluginKey.getState(view.state);

  return decorations.find(nodeStart, nodeEnd).find((d) => d.from === nodeStart && d.to === nodeEnd) !== undefined;
}

export function focusBlock(view: EditorView, blockId: string) {
  const plugin = lbPluginKey.get(view.state) as Plugin;
  const meta = { action: 'focus_block', blockId }

  const tr = view.state.tr.setMeta(plugin, meta)
  view.dispatch(tr)
}

function getHiddenBlockDecorations(doc: Node, blockId: string) {

  const decorations: Decoration[] = []
  let focusedBlockDepth: number | null = null

  doc.forEach((node, pos) => {
    if (node.type.name === 'lineblock' && node.attrs.blockId === blockId) {
      console.log("matching block")
      focusedBlockDepth = node.attrs.depth
      return;
    }
    

    if (node.type.name === 'lineblock' && (focusedBlockDepth === null || node.attrs.depth <= focusedBlockDepth)) {

      console.log(node.textContent, 'HIDING')
      decorations.push(Decoration.node(pos, pos + node.nodeSize, {}, {
        hidden: true
      }))
    }
  })

  return decorations
}

export const lineBlockPlugin = ProseMirrorReactPlugin.create({
  name: 'lbplugin',
  buildPlugin(editor) {
    const plugin: Plugin = new Plugin({
      key: lbPluginKey,
      state: {
        init(_, state) {
          return {
            decorations: DecorationSet.empty
          }
        },
        apply(tr, state) { 
          const meta = tr.getMeta(plugin)

          if (meta?.action === 'focus_block') {
            const { blockId } = meta

            console.log(blockId)

            return {
              decorations: DecorationSet.create(tr.doc, getHiddenBlockDecorations(tr.doc, blockId))
            }
          }

          return state

          return {
            decorations: state.decorations.map(tr.mapping, tr.doc)
          } 
        }
      },
      props: {
        decorations: (state) => plugin.getState(state)?.decorations,
      }
    })
    return plugin
  },
})
