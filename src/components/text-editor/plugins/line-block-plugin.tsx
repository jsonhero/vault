import { EditorState, Plugin, PluginKey, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";

import { ProseMirrorReactPlugin } from "~/lib/prosemirror-react";
import { Node } from "prosemirror-model";
import { ReactRenderer } from "~/lib/prosemirror-react/react-renderer";

/**
 * lineblock plugin will can take blockId on startup to target specific lines in tag view
 * Need breadcrumb for selected group nodes
 * doc -> blockId -> blockId -> etc.
 * 
 */

// tabs = multi windows 

const lbPluginKey = new PluginKey('lb-plugin')

export function isBlockHidden(view: EditorView, nodeStart: number, nodeEnd: number) {
  const { decorations } = lbPluginKey.getState(view.state);
  return decorations.find(nodeStart, nodeEnd).find((d) => d.from === nodeStart && d.to === nodeEnd)?.spec.hidden;
}

export function focusBlock(view: EditorView, blockId: string) {
  const plugin = lbPluginKey.get(view.state) as Plugin;
  const meta = { action: 'focus_block', blockId }

  const tr = view.state.tr.setMeta(plugin, meta)
  view.dispatch(tr)
}

function clearFocusBlock(view: EditorView) {
  const plugin = lbPluginKey.get(view.state) as Plugin;
  const meta = { action: 'clear_focus' }

  const tr = view.state.tr.setMeta(plugin, meta)
  view.dispatch(tr)
}

function getHiddenBlockDecorations(doc: Node, blockId: string) {

  const decorations: Decoration[] = []
  let focusedBlockDepth: number | null = null

  doc.forEach((node, pos) => {
    if (node.type.name === 'lineblock' && node.attrs.blockId === blockId) {
      focusedBlockDepth = node.attrs.depth
      decorations.push(Decoration.node(pos, pos + node.nodeSize, {}, {
        focusDepth: focusedBlockDepth
      }))
      return;
    }
    
    if (node.type.name === 'lineblock' && focusedBlockDepth === 0 && node.attrs.depth === 0) {
      focusedBlockDepth = null
    }
    
    if (node.type.name === 'lineblock' && (focusedBlockDepth === null || node.attrs.depth <= focusedBlockDepth)) {

      if (focusedBlockDepth) {
        focusedBlockDepth = null
      }

      decorations.push(Decoration.node(pos, pos + node.nodeSize, {}, {
        hidden: true
      }))
    } else {
      decorations.push(Decoration.node(pos, pos + node.nodeSize, {}, {
        focusDepth: focusedBlockDepth
      }))
    }
    
  })

  return decorations
}

export const BreadcrumbComponent = ({
  path,
  view
}) => {

  return (
    <div>
      {path.length ? (
        <div className="flex gap-2">
          <button onClick={() => clearFocusBlock(view)}>
            Doc
          </button>
          {path.map((blockId) => {
            return (
              <button key={blockId} onClick={() => focusBlock(view, blockId)}>{blockId}</button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
export const createLineBlockPlugin = (selectedBlockId?: string) => {
  const lineBlockPlugin = ProseMirrorReactPlugin.create({
    name: 'lbplugin',
    buildPlugin(editor) {
      let component: ReactRenderer | null;
  
      const plugin: Plugin = new Plugin({
        key: lbPluginKey,

        view(view) {
          component = new ReactRenderer(BreadcrumbComponent, {
            editor,
            as: document.getElementById('editor-breadcrumb')!,
            props: {
              view,
              path: [],
            }
          })
  
          return {
            update(view) {
              setTimeout(() => {
                component?.updateProps({ view })
              })
            },
            destroy() {
              component?.destroy()
            },
          }
        },
        state: {
          init(_, state) {

            if (selectedBlockId) {
              return {
                path: [selectedBlockId],
                decorations: DecorationSet.create(state.doc, getHiddenBlockDecorations(state.doc, selectedBlockId))
              }
            }
            return {
              path: [],
              decorations: DecorationSet.empty
            }
          },
          apply(tr, state) { 
            const meta = tr.getMeta(plugin)
  
            if (meta?.action === 'focus_block') {
              const { blockId } = meta
  
  
              const pathIndex = state.path.indexOf(blockId)
  
              let path: string[] = []
  
              if (pathIndex === -1) {
                path = [...state.path, blockId];
              } else {
                path = state.path.slice(0, pathIndex + 1)
              }
  
  
              component?.updateProps({
                path,
              })
  
              return {
                path,
                decorations: DecorationSet.create(tr.doc, getHiddenBlockDecorations(tr.doc, blockId))
              }
            } else if (meta?.action === 'clear_focus') {
              component?.updateProps({
                path: [],
              })
              return {
                path: [],
                decorations: DecorationSet.empty
              }
            }
  
            return {
              ...state,
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
  return lineBlockPlugin
}
