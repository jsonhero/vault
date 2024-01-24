import React from 'react'
import { 
  useNodeViewFactory,
  usePluginViewFactory,
  useWidgetViewFactory, 
} from '@prosemirror-adapter/react'

import {inputRules, wrappingInputRule, textblockTypeInputRule,
  InputRule,
  smartQuotes, emDash, ellipsis} from "prosemirror-inputrules"
import { EditorView } from 'prosemirror-view'
import { DOMParser, NodeRange, NodeType } from 'prosemirror-model'
import { EditorState, Plugin as ProseMirrorPlugin, Transaction, TextSelection } from 'prosemirror-state'
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { keymap } from 'prosemirror-keymap';

import { CodeMirrorNodeView } from './node-view'
import { schema } from './schema'
import { arrowHandler, createLineblockOnEnter, backspace } from './keymaps'
import { createLineNumberPlugin, createSlashPlugin, createRefPlugin } from './plugins'
import { LineBlockNode, ScriptBlockNode, TableBlockNode, HashtagInlineNode } from './nodes'

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

    tr = tr.setNodeAttribute(before, 'blockGroupId', '123')

    return tr
  })
}


/**
 * When I type #
 * Then lineblock will have attributes of group ID
 * <lineblock blockId="123" blockLocation="start" /> // don't need start
 * <lineblock blockId="123" />
 * <lineblock blockId="123" blockLocation="end" /> // don't need end
 * When you hit enter inside the block it adds blockId to copied block
 */

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

  const docFromHtml = parser.parse(document.createRange().createContextualFragment(htmlString));

  let _editorState = EditorState.create({
    schema,
    doc: docFromHtml,
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

export const TextEditor = React.memo(({
  renderId,
  onUpdate,
  docJson,
}: TextEditorProps) => {
  
  const nodeViewFactory = useNodeViewFactory()
  const pluginViewFactory = usePluginViewFactory()
  const widgetViewFactory = useWidgetViewFactory()
  const editorViewRef = useRef<EditorView>(null)

  const plugins = useMemo(() => [
    createSlashPlugin(pluginViewFactory), 
    createRefPlugin(pluginViewFactory), 
    keymapPlugin,
    createLineNumberPlugin(widgetViewFactory), 
    inputRules({ rules: [boldRule(), tagRule()]})
  ], [])

  useEffect(() => {
    if (renderId) {
      const newNoteState = createEditorState(docJson, plugins)
      editorViewRef.current?.updateState(newNoteState)
    }
  }, [docJson, renderId])

  useEffect(() => {
    if (onUpdate) {
      editorViewRef.current?.setProps({
        dispatchTransaction: dispatchTransactionFactory(editorViewRef.current, onUpdate),
      })
    }
  }, [onUpdate])
  

  const editorRef = useCallback((element: HTMLDivElement) => {

    if (!element || element.firstChild)
        return

    // Todo: store in editor view context somewhere
    editorViewRef.current = new EditorView(element, {
      state: createEditorState(docJson, plugins),
      dispatchTransaction: dispatchTransactionFactory(editorViewRef.current!, onUpdate),
      nodeViews: {
        hashtag: nodeViewFactory({
          component: HashtagInlineNode
        }),
        lineblock: nodeViewFactory({
          component: LineBlockNode,
          contentAs() {
            const ele = document.createElement('div');
            ele.className = 'flex';
            return ele
          },
        }),
        tableblock: nodeViewFactory({
          component: TableBlockNode,
          as() {
            const ele = document.createElement('div');
            ele.className = 'w-full';
            return ele
          },
          stopEvent() {
            return true
          }
        }),
        scriptblock: nodeViewFactory({
          component: ScriptBlockNode,
          as() {
            const ele = document.createElement('div')
            ele.className = 'w-full'
            return ele
          },
        }),
        codemirror: (node, view, getPos) => new CodeMirrorNodeView(node, view, getPos)
      }
    })
  }, [])
  
  return (
    <div className="editor focus:outline-none" ref={editorRef} />
  )
}, (prevProps, nextProps) => prevProps.renderId === nextProps.renderId)