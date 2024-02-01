import React, { Component, useState } from 'react'
import { 
  useNodeViewFactory,
  usePluginViewFactory,
  useWidgetViewFactory, 
} from '@prosemirror-adapter/react'

import {inputRules, wrappingInputRule, textblockTypeInputRule,
  InputRule,
  smartQuotes, emDash, ellipsis} from "prosemirror-inputrules"
import { EditorView } from 'prosemirror-view'
import { DOMParser, Node, NodeRange, NodeType } from 'prosemirror-model'
import { EditorState, Plugin as ProseMirrorPlugin, Transaction, TextSelection } from 'prosemirror-state'
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { keymap } from 'prosemirror-keymap';

import { Editor, EditorFactoryProps, ProseMirrorReactNode, ProseMirrorReactPlugin } from '~/lib/prosemirror-react'

import { CodeMirrorNodeView, LineBlockNodeView, HashtagNodeView } from './node-view'
import { schema } from './schema'
import { arrowHandler, createLineblockOnEnter, backspace } from './keymaps'
import { createLineBlockPlugin, hashtagPlugin, slashPlugin, focusBlock, isBlockHidden } from './plugins'
import { LineBlockNode, ScriptBlockNode, TableBlockNode, HashtagInlineNode } from './nodes'
import { nanoid } from 'nanoid'
import { ChevronDown, ChevronRight, CircleDashedIcon, CircleDotIcon, DotIcon } from 'lucide-react'
import { VaultExtension } from '~/extensions/todo'

const blockId = () => nanoid(5)


const keymapPlugin = keymap({
  Tab: (state, dispatch) => {
    const before = state.selection.$anchor.before(1)
    const lineblock = state.doc.nodeAt(before)

    const previousLineblock = state.doc.childBefore(before)
    const depth = lineblock?.attrs.depth

    if (
      previousLineblock.node &&
      previousLineblock.node.attrs.depth === depth ||
      previousLineblock.node?.attrs.depth > depth  
    ) {

      const tr = state.tr.setNodeAttribute(before, 'depth', depth + 1)

      if (dispatch) {
        dispatch(tr)
      }
    }

    return true
  },
  "Shift-Tab": (state, dispatch) => {
    const before = state.selection.$anchor.before(1)
    const lineblock = state.doc.nodeAt(before)
  
    const depth = lineblock?.attrs.depth

    if (depth > 0) {
      let tr = state.tr.setNodeAttribute(before, 'depth', lineblock?.attrs.depth - 1)

      // eslint-disable-next-line no-inner-declarations
      function recurseChildren(pos: number) {
        const nextLineblock = state.doc.nodeAt(pos)

        if (nextLineblock) {
          const nextDepth = nextLineblock.attrs.depth
          if (nextDepth > depth) {
            tr = tr.setNodeAttribute(pos, 'depth', nextDepth - 1)
            recurseChildren(pos + nextLineblock.nodeSize)
          }
        }
      }
      recurseChildren(state.selection.$anchor.after(1))

      if (dispatch) {
        dispatch(tr)
      }
    }
    return true
  },
  Enter: createLineblockOnEnter,
  Backspace: backspace,
  ArrowLeft: arrowHandler("left"),
  ArrowRight: arrowHandler("right"),
  ArrowUp: arrowHandler("up"),
  ArrowDown: arrowHandler("down")
});


interface TextEditorProps {
  renderId: string | null | undefined;
  docJson: string | null | undefined;
  onUpdate: (state: EditorState) => void;
  selectedBlockId?: string;
  extensions: VaultExtension[]
}
const boldRegex = /\*\*([^*]+)\*\*/
export function boldRule () {
  return new InputRule(boldRegex, (state, match, start, end) => {
    const tr = state.tr
    tr.addMark(start, end, schema.marks.strong.create())
                .insertText(match[1], start, end)
                .removeStoredMark(schema.marks.strong)
      

      return tr
    

    // return state.tr
  })
}

const tagRegex = /#[a-zA-Z0-9]/
export function tagRule () {
  return new InputRule(tagRegex, (state, match, start, end) => {
    let tr = state.tr

    const before = state.selection.$anchor.before(1)

    const lineblock = state.doc.nodeAt(before)

    const $start = state.doc.resolve(start)
    const $end = state.doc.resolve(end)
    const range = new NodeRange($start, $end, $start.depth)

    if (range) {
      tr = tr.wrap(range, [{ type: schema.nodes.hashtag }])
    }

    const parentDepth = lineblock?.attrs.blockGroupDepth
    
    tr = tr.setNodeAttribute(before, 'blockGroupId', blockId())

    if (parentDepth === null) {
      tr = tr.setNodeAttribute(before, 'blockGroupDepth', 0)
    } else {
      tr = tr.setNodeAttribute(before, 'blockGroupDepth', parentDepth + 1)
    }
  
    return tr
  })
}

function createEditorState(doc: string | null | undefined, plugins: ProseMirrorPlugin[]): EditorState {
  const parser = DOMParser.fromSchema(schema);
  // const htmlString = '<lineblock><p>Hello, its me!</p></lineblock><lineblock><scriptblock><codemirror></codemirror></scriptblock></lineblock>';
  const htmlString = '<lineblock><p>Hello, its me!</p></lineblock>'

  const schemaDoc = schema.node('doc', null, [
    schema.nodes.lineblock.create({
      blockId: blockId(),
    }, 
      schema.nodes.paragraph.create(null, [schema.text("Hello, it's meee!")])
    )
  ]
  )
  const docFromHtml = parser.parse(document.createRange().createContextualFragment(htmlString));

  let _editorState = EditorState.create({
    schema,
    doc: schemaDoc,
    plugins,
  });

  if (doc) {
    _editorState = EditorState.fromJSON({
      schema,
      plugins
    }, doc)
  }

  return _editorState
}

function dispatchTransactionFactory(view: EditorView, onUpdate: (state: EditorState) => void, setView: (view: EditorView) => void) {
  return (tr: Transaction) => {
    // update view state
    const newState = view.state.apply(tr);

    if (onUpdate) {
      onUpdate(newState)
    }
  
    view.updateState(newState);

    setView(view)
  }

}

export const TextEditor = React.memo(({
  renderId,
  onUpdate,
  docJson,
  selectedBlockId,
  extensions,
}: TextEditorProps) => {
  const editorViewRef = useRef<EditorView>(null)
  const [editorView, setEditorView] = useState<EditorView | null>(null)

  const [_, setForce] = useState(() => 0)

  const forceUpdate = () => {
    setForce((n) => n + 1)
  }

  const setView = (view: EditorView) => {
    setEditorView(editorView)
    forceUpdate()
  }

  const plugins = useMemo(() => [
    // createSlashPlugin(pluginViewFactory), 
    // createRefPlugin(pluginViewFactory), 
    keymapPlugin,
    // createLineNumberPlugin(widgetViewFactory), 
    inputRules({ rules: [
      boldRule(), 
      // tagRule()
    ]}),
  ], [])

  
  useEffect(() => {
    if (renderId) {
      
      const newNoteState = createEditorState(docJson, editorViewRef.current.state.plugins)
      setTimeout(() => {
        editorViewRef.current?.updateState(newNoteState)
      })
    }
  }, [docJson, renderId])

  useEffect(() => {
    if (onUpdate) {
      editorViewRef.current?.setProps({
        dispatchTransaction: dispatchTransactionFactory(editorViewRef.current, onUpdate, setView),
      })
    }
  }, [onUpdate])


  const onInit = useCallback((element: HTMLDivElement, factory: EditorFactoryProps) => {

    const extensionPlugins = extensions.flatMap((ext) => ext.props.prosemirror.plugins)
    const extensionNodes = extensions.flatMap((ext) => ext.props.prosemirror.nodes)

    // Todo: store in editor view context somewhere
    editorViewRef.current = new EditorView(element, {
      state: createEditorState(docJson, [...factory.buildReactPlugins([
        createLineBlockPlugin(selectedBlockId), 
        hashtagPlugin,
        slashPlugin,
        ...extensionPlugins,
      ]), ...plugins]),
      dispatchTransaction: dispatchTransactionFactory(editorViewRef.current!, onUpdate, setView),
      nodeViews: {
        lineblock: (node, view, getPos, decorations) => new LineBlockNodeView(node, decorations),
        hashtag: (node, view, getPos) => new HashtagNodeView(node, view, getPos),
        ...factory.buildReactNodes(extensionNodes)
      }
    })
    setEditorView(editorViewRef.current)
  }, [])
  
  return (
    <div>
      <div id="editor-breadcrumb">
        
      </div>
      <div className="relative flex items-start">
        <TextEditorGutter view={editorView} />
        <Editor onInit={onInit} /> 
      </div>
    </div>

  )
}, (prevProps, nextProps) => prevProps.renderId === nextProps.renderId)



interface TextEditorGutterProps {
  view: EditorView | null
}

interface TextEditorGutterState {
  lines: any[]
}

// need to optimize this..
class TextEditorGutter extends Component<TextEditorGutterProps, TextEditorGutterState> {

  observer?: ResizeObserver

  constructor(props: TextEditorGutterProps) {
    super(props)
    this.state = {
      lines: []
    }
  }

  static getUpdatedLines(view: EditorView) {
    const nextLines: any[] = []

    let previousNode: Node | null = null
    let groupDepths: { [key: number]: number } = {}

    view.state.doc.forEach((node, offset, i) => {

      if (node.type.name === 'lineblock') {

        const nodeElement = view.nodeDOM(offset) as HTMLDivElement

        const hidden = isBlockHidden(view, offset, offset + node.nodeSize)

        const nodeHeight = nodeElement?.clientHeight || 0

        const prevDepth = previousNode?.attrs.depth
        const depth = node.attrs.depth

        if (depth < prevDepth) {
          delete groupDepths[prevDepth]
        }

        if (depth in groupDepths) {
          delete groupDepths[depth]
        }

        if (previousNode !== null && depth > prevDepth) {
          groupDepths[prevDepth] = i - 1
          const line = nextLines[i - 1]
          line.isGroupNode = true
        }

        for (let d = 0; d <= depth; d++) {
          const groupIdx = groupDepths[d]
          const root = nextLines[groupIdx]

          if (root) {
            if (!hidden) {
              root.groupHeight += nodeHeight
            }
            root.groupEndPos = offset
          }
        }
        
        previousNode = node
        nextLines.push({
          node,
          hidden,
          isGroupNode: false,
          lineNumber: i + 1,
          groupStartPos: offset,
          groupEndPos: offset,
          groupHeight: 0,
          depth,
          height: nodeHeight
        })
      }

    })

    return nextLines.filter((line) => !line.hidden)
  }


  static getDerivedStateFromProps(props: TextEditorGutterProps, state: TextEditorGutterState) {

    if (!props.view) {
      return state
    }

    return {
      lines: TextEditorGutter.getUpdatedLines(props.view)
    }
  }

  componentDidMount(): void {
    const mirror = document.querySelector('.ProseMirror')

    this.observer = new ResizeObserver((entries) => {
      const view = this.props.view

      if (view) {
        this.setState({
          lines: TextEditorGutter.getUpdatedLines(view)
        })
      }
    })

    if (mirror) {
      this.observer.observe(mirror)
    }
  }

  componentWillUnmount(): void {  
    this.observer?.disconnect()
  }
  
  onToggleGroup = (line: any) => {


    const view = this.props.view!

    focusBlock(view, line.node.attrs.blockId)

    // if (line.groupStartPos !== line.groupEndPos)  {
    //   const positions: number[] = []
    //   view?.state.doc.nodesBetween(line.groupStartPos, line.groupEndPos + 1, (node, pos) => {
    //     positions.push(pos)
    //     return false;
    //   })

    //   const hidden = !line.node.attrs.groupHidden
    
    //   let tr = view.state.tr

    //   positions.forEach((pos) => {
    //     if (pos !== line.groupStartPos) {
    //       tr = tr.setNodeAttribute(pos, "hidden", hidden)
    //       tr = tr.setNodeAttribute(pos, "groupHidden", hidden)
    //     } else {
    //       tr = tr.setNodeAttribute(pos, "groupHidden", hidden)
    //     }
    //   })

    //   view.dispatch(tr)
    // }
  
  }

  render() {
    const view = this.props.view

    let selectedBlockId = null
    if (view) {
      const linePos = view.state.selection.$anchor.before(1)
      const node = view.state.doc.nodeAt(linePos)

      selectedBlockId = node?.attrs.blockId
    }


    const minDepth = this.state.lines.reduce((min, line) => (min === null || line.depth < min) ? line.depth : min, null)


    return (
      <div className="sticky pr-3 z-50">
        <div className="flex flex-col flex-shrink-0 min-w-[38px]">
          {this.state.lines.map((line: any, i: number) => {
            return (
              <div className="group flex items-center justify-between relative">
                <div className="text-gray-600" style={{ height: line.height }}>{line.lineNumber}</div>
                  <div className="absolute" style={{
                    left: 24 + ((line.depth - minDepth) * 24) + 'px'
                  }}>
                    {(line.depth > 0 || line.isGroupNode || (line.node.attrs.blockId === selectedBlockId)) && (
                      <button className="bg-tertiary flex justify-center items-center w-[24px]" onClick={() => this.onToggleGroup(line)}>
                        {line.node.attrs.groupHidden ? <CircleDotIcon size={16} /> : <DotIcon /> }
                      </button>
                    )}
                    {line.groupHeight > 0 && (
                      <div className="absolute left-[12px] w-[1px] bg-gray-700 group-hover:bg-gray-400 group-hover:z-10" style={{
                        top: (line.height - 4)  + 'px',
                        height: line.groupHeight + 'px'
                      }}>
                        
                      </div>
                    )}
                    
                  </div>
  
              </div>
            )
          })}
        </div>
      </div>
    )
  }

}

