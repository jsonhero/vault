import React from 'react'
import { 
  useNodeViewFactory,
  usePluginViewFactory, 
} from '@prosemirror-adapter/react'

import { EditorView } from 'prosemirror-view'
import { DOMParser } from 'prosemirror-model'
import { EditorState, Plugin as ProseMirrorPlugin, Transaction } from 'prosemirror-state'
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { keymap } from 'prosemirror-keymap';

import { CodeMirrorNodeView } from './node-view'
import { schema } from './schema'
import { arrowHandler, createLineblockOnEnter, backspace } from './keymaps'
import { lineNumberPlugin, createSlashPlugin } from './plugins'
import { LineBlockNode, ScriptBlockNode, TableBlockNode } from './nodes'

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
  const editorViewRef = useRef<EditorView>(null)

  const plugins = useMemo(() => [createSlashPlugin(pluginViewFactory), keymapPlugin, lineNumberPlugin], [])

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
    <div className="editor" ref={editorRef} />
  )
}, (prevProps, nextProps) => prevProps.renderId === nextProps.renderId)