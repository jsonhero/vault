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
import { lineNumberPlugin, createSlashPlugin, createRefPlugin } from './plugins'
import { LineBlockNode, ScriptBlockNode, TableBlockNode, HashtagInlineNode } from './nodes'
import { nanoid } from 'nanoid'
import { ChevronDown, ChevronRight } from 'lucide-react'

const blockId = () => nanoid(5)


const keymapPlugin = keymap({
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
}
const boldRegex = /\*\*([^*]+)\*\*/
export function boldRule () {
  return new InputRule(boldRegex, (state, match, start, end) => {
    console.log(match, 'match??!?')
    const tr = state.tr
    tr.addMark(start, end, schema.marks.strong.create())
                .insertText(match[1], start, end)
                .removeStoredMark(schema.marks.strong)
      

      return tr
    

    // return state.tr
  })
}

const tagRegex = /#[a-zA-Z0-9]+\s/
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


const TestPlugin = new ProseMirrorPlugin({
  props: {
    handleKeyDown(view, event) {
      if (event.key === '*') {
        const node = view.state.doc.resolve(view.state.selection.anchor).parent

        const match = boldRegex.exec(node.textContent)
        if (match) {
          const tr = view.state.tr
          const end = view.state.selection.anchor
          const start = end - node.textContent.length


          tr.addMark(start, end, schema.marks.strong.create())
                .insertText(match[1], start, end)
                .removeStoredMark(schema.marks.strong)
                // .setSelection(TextSelection.create(view.state.doc, tr.selection.anchor + 1))

          view.dispatch(tr)
          return true
        }
        
      }

    }
  }
})

function createEditorState(doc: string | null | undefined, plugins: ProseMirrorPlugin[]): EditorState {
  const parser = DOMParser.fromSchema(schema);
  // const htmlString = '<lineblock><p>Hello, its me!</p></lineblock><lineblock><scriptblock><codemirror></codemirror></scriptblock></lineblock>';
  const htmlString = '<lineblock><p>Hello, its me!</p></lineblock>'

  const schemaDoc = schema.node('doc', null, schema.nodes.lineblock.create({
      blockId: blockId(),
    }, 
      schema.nodes.paragraph.create(null, [schema.text("Hello, it's meee!")])
    )
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

function dispatchTransactionFactory(view: EditorView, onUpdate?: (state: EditorState) => void) {
  return (tr: Transaction) => {
    // update view state
    const newState = view.state.apply(tr);

    if (onUpdate) {
      onUpdate(newState)
    }
  
    view.updateState(newState);
  }

}


/**
 * <p data-block-id="1">line 1</p>
 * <p data-block-id="2">line 2</p>
 */

const Lineblock = ProseMirrorReactNode.create({
  component: LineBlockNode,
  name: 'lineblock',
  contentAs() {
    const ele = document.createElement('div');
    // https://stackoverflow.com/questions/25897883/edit-cursor-not-displayed-on-chrome-in-contenteditable
    ele.className = 'flex';
    return ele
  },
})

export const TextEditor = React.memo(({
  renderId,
  onUpdate,
  docJson,
}: TextEditorProps) => {
  const editorViewRef = useRef<EditorView>(null)

  const plugins = useMemo(() => [
    // createSlashPlugin(pluginViewFactory), 
    // createRefPlugin(pluginViewFactory), 
    keymapPlugin,
    // createLineNumberPlugin(widgetViewFactory), 
    inputRules({ rules: [boldRule(), tagRule()]})
  ], [])

  
  useEffect(() => {
    if (renderId) {
      const newNoteState = createEditorState(docJson, plugins)
      setTimeout(() => {
        console.log(docJson)
        editorViewRef.current?.updateState(newNoteState)
      })
    }
  }, [docJson, renderId])

  useEffect(() => {
    if (onUpdate) {
      editorViewRef.current?.setProps({
        dispatchTransaction: dispatchTransactionFactory(editorViewRef.current, onUpdate),
      })
    }
  }, [onUpdate])
  

  const onInit = useCallback((element: HTMLDivElement, factory: EditorFactoryProps) => {
    // Todo: store in editor view context somewhere
    editorViewRef.current = new EditorView(element, {
      state: createEditorState(docJson, plugins),
      dispatchTransaction: dispatchTransactionFactory(editorViewRef.current!, onUpdate),
      nodeViews: {
        lineblock: (node) => new LineBlockNodeView(node),
        hashtag: (node) => new HashtagNodeView(node),
        // hashtag: nodeViewFactory({
        //   component: HashtagInlineNode
        // }),
        // lineblock: nodeViewFactory({
        //   component: LineBlockNode,
        //   contentAs() {
        //     const ele = document.createElement('div');
        //     ele.className = 'flex';
        //     return ele
        //   },
        // }),
        // tableblock: nodeViewFactory({
        //   component: TableBlockNode,
        //   as() {
        //     const ele = document.createElement('div');
        //     ele.className = 'w-full';
        //     return ele
        //   },
        //   stopEvent() {
        //     return true
        //   }
        // }),
        // scriptblock: nodeViewFactory({
        //   component: ScriptBlockNode,
        //   as() {
        //     const ele = document.createElement('div')
        //     ele.className = 'w-full'
        //     return ele
        //   },
        // }),
        // codemirror: (node, view, getPos) => new CodeMirrorNodeView(node, view, getPos)
      }
    })
  }, [])
  
  return (
    <div className="relative flex items-start">
      <TextEditorGutter view={editorViewRef.current} />
      <Editor onInit={onInit} /> 
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

  componentDidMount(): void {
    const mirror = document.querySelector('.ProseMirror')

    this.observer = new ResizeObserver((entries) => {
      const nextLines: any[] = []

      const view = this.props.view

      let previousNode: Node | null = null
      let groupDepths: { [key: number]: number } = {}

      view?.state.doc.forEach((node, offset, i) => {

        if (node.type.name === 'lineblock') {
          let isBlockGroupRoot = false

          const blockGroupId = node.attrs.blockGroupId
          const blockGroupDepth = node.attrs.blockGroupDepth

          const nodeElement = view.nodeDOM(offset) as HTMLDivElement

          const nodeHeight = nodeElement.clientHeight
          const previousDepth = previousNode?.attrs.blockGroupDepth

          if ((blockGroupDepth === null || blockGroupDepth < previousDepth) && previousDepth !== null) {
            delete groupDepths[previousDepth]
          }

  
          if (blockGroupId) {
            if (!previousNode) {
              isBlockGroupRoot = true
              groupDepths[blockGroupDepth] = i
            } else {
              const prevBlockGroupId = previousNode.attrs.blockGroupId
              if ((!prevBlockGroupId || prevBlockGroupId !== blockGroupId) && !(blockGroupDepth in groupDepths)) {
                isBlockGroupRoot = true
                groupDepths[blockGroupDepth] = i
              }

              if (blockGroupDepth != null) {
                for (let d = 0; d <= blockGroupDepth; d++) {
                  const groupIdx = groupDepths[d]
                  const root = nextLines[groupIdx]
                  if (blockGroupId === "8NgeO" && d  == 2) {
                    console.log(node, root, "node", groupDepths, nextLines.length)
                  }

                  if (root && !(isBlockGroupRoot && blockGroupDepth == d)) {

                    
                    if (!node.attrs.hidden) {
                      root.groupHeight += nodeHeight
                    }
                    root.groupEndPos = offset
                  }
                }            
    
  
              }
            }
          }

          
          previousNode = node
          // think this hides lines for groups on common depth..
          if (!node.attrs.hidden) {
            nextLines.push({
              node,
              lineNumber: i + 1,
              groupStartPos: offset,
              groupEndPos: offset,
              groupHeight: 0,
              depth: blockGroupDepth,
              isBlockGroupRoot,
              height: nodeHeight
            })
          }
        }

      })

      this.setState({ lines: nextLines })
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

    if (line.groupStartPos !== line.groupEndPos)  {
      const positions: number[] = []
      view?.state.doc.nodesBetween(line.groupStartPos, line.groupEndPos + 1, (node, pos) => {
        positions.push(pos)
        return false;
      })

      const hidden = !line.node.attrs.groupHidden
    
      let tr = view.state.tr

      positions.forEach((pos) => {
        if (pos !== line.groupStartPos) {
          tr = tr.setNodeAttribute(pos, "hidden", hidden)
          tr = tr.setNodeAttribute(pos, "groupHidden", hidden)
        } else {
          tr = tr.setNodeAttribute(pos, "groupHidden", hidden)
        }
      })

      

      view.dispatch(tr)
    }
  
  }

  render() {
    return (
      <div className="sticky pr-3 z-50">
        <div className="flex flex-col flex-shrink-0 min-w-[38px]">
          {this.state.lines.map((line: any, i: number) => {
            return (
              <div className="group flex items-center justify-between">
                <div className="text-gray-600" style={{ height: line.height }}>{line.lineNumber}</div>
                {line.isBlockGroupRoot && (
                  <div className="relative top-[2px]" style={{
                    left: line.depth * 18 + 'px'
                  }}>
                    <button className="bg-tertiary z-20" onClick={() => this.onToggleGroup(line)}>
                      {!line.node.attrs.groupHidden ? <ChevronDown className='text-gray-500' size={16} /> : <ChevronRight className='text-gray-500' size={16} />}
                    </button>
                    <div className="absolute right-[8px] w-[1px] bg-gray-700 group-hover:bg-gray-400 group-hover:z-10" style={{
                      top: line.height + 'px',
                      height: line.groupHeight + 'px'
                    }}>
                      <div className="absolute left-[-4px] bottom-[5px] h-[1px] w-[9px] bg-gray-700 group-hover:bg-gray-400">

                      </div>
  
                    </div>
                  </div>
                )}
  
              </div>
            )
          })}
        </div>
      </div>
    )
  }

}



/**
 * 
 * <block group=1 gdepth=0>
 * <block group=1 gdepth=0>
 * <block group=2 gdepth=1>
 * <block group=4 gdepth=2>
 * <block group=2 gdepth=1>
 * <block group=3 gdepth=1> // how would I tell that this is in group 1 still, maybe highlight the chevron?
 * 
 * <block group=1 gdepth=0> // what if no surrounding group 1
 * 
 *  Maybe a toggle to show padding depth on block groups?
 */