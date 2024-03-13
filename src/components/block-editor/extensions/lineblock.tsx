import { EditorState, Plugin, PluginKey, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";

import { Editor, Extension } from "~/lib/vault-prosemirror";
import { Node } from "prosemirror-model";
import { ReactRenderer } from "~/lib/vault-prosemirror/react";
import { useEffect, useState } from "react";
import { ChevronRightIcon } from "lucide-react";

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

export function isBlockGroupHidden(view: EditorView, nodeStart: number, nodeEnd: number) {
  const { decorations } = lbPluginKey.getState(view.state);
  return decorations.find(nodeStart, nodeEnd).find((d) => d.from === nodeStart && d.to === nodeEnd)?.spec.groupHidden;
}

export function focusBlock(view: EditorView, blockId: string) {
  const plugin = lbPluginKey.get(view.state) as Plugin;
  const meta = { action: 'focus_block', blockId }

  const tr = view.state.tr.setMeta(plugin, meta)
  view.dispatch(tr)
}

export function hideBlockList(view: EditorView, blockId: string) {
  const plugin = lbPluginKey.get(view.state) as Plugin;
  const meta = { action: 'hide_block_list', blockId }

  const tr = view.state.tr.setMeta(plugin, meta)
  view.dispatch(tr)
}

export function showBlockList(view: EditorView, blockId: string) {
  const plugin = lbPluginKey.get(view.state) as Plugin;
  const meta = { action: 'show_block_list', blockId }

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
    }
    
  })

  return decorations
}

function getBlockListDecorations(doc: Node, blockId: string, isHidden: boolean) {
  const decorations: Decoration[] = []
  let focusedBlockDepth: number | null = null

  doc.forEach((node, pos) => {
    if (node.type.name === 'lineblock' && node.attrs.blockId === blockId) {
      focusedBlockDepth = node.attrs.depth
      decorations.push(Decoration.node(pos, pos + node.nodeSize, {}, {
        groupHidden: isHidden,
        listBlockId: blockId,
      }))
      return;
    }

    if (node.type.name === 'lineblock' && focusedBlockDepth === node.attrs.depth) {
      focusedBlockDepth = null
    }
    
    if (node.type.name === 'lineblock' && (focusedBlockDepth !== null && node.attrs.depth > focusedBlockDepth)) {
      decorations.push(Decoration.node(pos, pos + node.nodeSize, {}, {
        hidden: isHidden,
        listBlockId: blockId,
      }))
    }
    
  })

  return decorations
}

function getBlockNode(doc: Node, blockId: string): Node | null {
  let blockNode: Node | null = null

  doc.forEach((node) => {
    if (node.type.name === 'lineblock' && node.attrs.blockId === blockId) {
      blockNode = node
    }
  })

  return blockNode
}

function setFocusDepthOfBlock(editor: Editor, doc: Node, blockId: string) {
  const blockNode = getBlockNode(doc, blockId)

  if (blockNode) {
    setFocusDepth(editor, blockNode.attrs.depth)
  }
}

function setFocusDepth(editor: Editor, depth: number) {
  const editorContainer = document.querySelector(`[data-editor-id='${editor.id}']`) as HTMLDivElement

  editorContainer?.style.setProperty('--focus-depth', depth.toString())
}

export const BreadcrumbComponent = ({
  view,
  selectedBlockId,
}: {
  selectedBlockId: string,
  view: EditorView
}) => {

  const [blockPath, setBlockPath] = useState<any[]>([])

  useEffect(() => {
    const doc = view.state.doc
    const count = doc.childCount

    let blockIdx: number | undefined = undefined
    let startBlock: Node | undefined = undefined
    let block: Node | undefined = undefined
    for (let i = 0; i < count; i++) {
      const child = doc.child(i)

      if (child.attrs.depth === 0) {
        startBlock = child
      }

      if (child.attrs.blockId === selectedBlockId) {
        blockIdx = i
        block = child
        break;
      }
    }

    if (blockIdx && block && startBlock) {
      let depth: number = block.attrs.depth
      const _childPath = []
      for (let i = blockIdx; i >= 0; i--) {
        const child = doc.child(i)

        if (child.attrs.depth < depth) {
          depth = child.attrs.depth
          _childPath.unshift({
            blockId: child.attrs.blockId,
            content: child.textContent
          })
        }

        if (depth === 0) {
          break;
        }
      }

      setBlockPath(_childPath)
    }

  }, [selectedBlockId])

  return (
    <div>
      {selectedBlockId ? (
        <div className="flex gap-2">
          <button className="flex gap-1 items-center" onClick={() => clearFocusBlock(view)}>
            <div>
              Title
            </div>
            {blockPath.length > 0 ? <ChevronRightIcon /> : null}
          </button>
          {blockPath.map((node, i) => {
            const isLast = blockPath.length - 1 === i

            return (
              <button className="flex gap-1 items-center" key={node.blockId} onClick={() => focusBlock(view, node.blockId)}>
                <div>
                  {node.content}
                </div>
                {!isLast && <ChevronRightIcon />}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

interface LineblockExtensionOptions {
  selectedBlockId?: string;
  onSelectBlockId?: (blockId: string | null) => void;
}

export const LineblockExtension = Extension.create<LineblockExtensionOptions>({
  name: 'lineblock',
  proseMirrorPlugins() {
    let component: ReactRenderer | null;
    const editor = this.editor
    const options = this.options


    const editorContainer = document.querySelector(`[data-editor-id='${this.editor.id}']`) as HTMLDivElement
    const breadcrumbEl = document.createElement('div')
    breadcrumbEl.className = 'editor-breadcrumb'
    editorContainer?.prepend(breadcrumbEl)

    editorContainer?.style.setProperty('--block-margin', '28px')
    setFocusDepth(editor, 0)


    const plugin: Plugin = new Plugin({
      key: lbPluginKey,

      view(view) {
        if (options.selectedBlockId) {
          const blockNode = getBlockNode(view.state.doc, options.selectedBlockId)
    
          if (blockNode) {
            setFocusDepth(editor, blockNode.attrs.depth)
          }
        }

        
        component = new ReactRenderer(BreadcrumbComponent, {
          editor,
          as: breadcrumbEl,
          props: {
            view,
            path: options.selectedBlockId ? [options.selectedBlockId] : [],
            selectedBlockId: options.selectedBlockId,
          }
        })

        return {
          update(view) {
            setTimeout(() => {
              component?.updateProps({ view })
            })
          },
          destroy() {
            setTimeout(() => {
              component?.destroy()
            })
            breadcrumbEl.remove()
          },
        }
      },
      state: {
        init(_, state) {

          if (options.selectedBlockId) {
            return {
              path: [options.selectedBlockId],
              decorations: DecorationSet.create(state.doc, getHiddenBlockDecorations(state.doc, options.selectedBlockId)),
              selectedBlockId: options.selectedBlockId,
            }
          }
          return {
            path: [],
            decorations: DecorationSet.empty,
            selectedBlockId: options.selectedBlockId,
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

            const blockNode = getBlockNode(tr.doc, blockId)

            if (blockNode) {
              setFocusDepth(editor, blockNode.attrs.depth)
            }

            component?.updateProps({
              path,
              selectedBlockId: blockId,
            })

            if (options.onSelectBlockId) {
              options.onSelectBlockId(blockId)
            }

            return {
              path,
              decorations: DecorationSet.create(tr.doc, getHiddenBlockDecorations(tr.doc, blockId)),
              selectedBlockId: blockId,
            }
          } else if (meta?.action === 'hide_block_list') {
            const { blockId } = meta

            const blockNode = getBlockNode(tr.doc, blockId)

            if (blockNode) {
              return {
                ...state,
                decorations: state.decorations.add(tr.doc, getBlockListDecorations(tr.doc, blockId, true)),
              }
            }

          } else if (meta?.action === 'show_block_list') {
            const { blockId } = meta

            const blockNode = getBlockNode(tr.doc, blockId)

            if (blockNode) {
              const decors = state.decorations.find(undefined, undefined, (spec) => spec.listBlockId === blockId)
              return {
                ...state,
                decorations: state.decorations.remove(decors),
              }
            }
          } else if (meta?.action === 'clear_focus') {
            setFocusDepth(editor, 0)

            component?.updateProps({
              path: [],
              selectedBlockId: null,
            })

            if (options.onSelectBlockId) {
              options.onSelectBlockId(null)
            }

            return {
              selectedBlockId: null,
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

    return [plugin]
  },
})



/**
 * 
 * How to do path + extra context expander?
 */