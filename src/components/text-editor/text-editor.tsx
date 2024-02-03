import React from 'react'

import { inputRules, InputRule } from "prosemirror-inputrules"
import { EditorView } from 'prosemirror-view'
import { DOMParser } from 'prosemirror-model'
import { EditorState, Plugin as ProseMirrorPlugin, Transaction } from 'prosemirror-state'
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Editor, EditorFactoryProps } from '~/lib/prosemirror-react'

import { LineBlockNodeView, HashtagNodeView } from './node-view'
import { schema } from './schema'
import { 
  createLineBlockPlugin, 
  hashtagPlugin, 
  slashPlugin, 
  gutterPlugin, 
  referencePlugin,
  keymapPlugin
} from './plugins'
import { EntityRecordNode, ReferenceNode } from './nodes'
import { VaultExtension } from '~/extensions/todo'
import { generateBlockId } from './utils'


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


function createEditorState(doc: string | null | undefined, plugins: ProseMirrorPlugin[]): EditorState {
  const parser = DOMParser.fromSchema(schema);
  // const htmlString = '<lineblock><p>Hello, its me!</p></lineblock><lineblock><scriptblock><codemirror></codemirror></scriptblock></lineblock>';
  const htmlString = '<lineblock><p>Hello, its me!</p></lineblock>'

  const schemaDoc = schema.node('doc', null, [
    schema.nodes.lineblock.create({
      blockId: generateBlockId(),
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

function dispatchTransactionFactory(view: EditorView, onUpdate: (state: EditorState) => void) {
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
  selectedBlockId,
  extensions,
}: TextEditorProps) => {
  const editorViewRef = useRef<EditorView>(null)

  const plugins = useMemo(() => [
    keymapPlugin,
    inputRules({ rules: [
      boldRule(), 
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
        dispatchTransaction: dispatchTransactionFactory(editorViewRef.current, onUpdate),
      })
    }
  }, [onUpdate])


  const onInit = useCallback((element: HTMLDivElement, factory: EditorFactoryProps) => {

    const extensionPlugins = extensions.flatMap((ext) => ext.props.prosemirror.plugins)
    const extensionNodes = extensions.flatMap((ext) => ext.props.prosemirror.nodes)

    const nodes = factory.buildReactNodes([...extensionNodes, EntityRecordNode, ReferenceNode])

    // Todo: store in editor view context somewhere
    editorViewRef.current = new EditorView(element, {
      state: createEditorState(docJson, [...factory.buildReactPlugins([
        gutterPlugin,
        createLineBlockPlugin(selectedBlockId), 
        hashtagPlugin,
        slashPlugin,
        referencePlugin,
        ...extensionPlugins,
      ]), ...plugins]),
      dispatchTransaction: dispatchTransactionFactory(editorViewRef.current!, onUpdate),
      nodeViews: {
        lineblock: (node, view, getPos, decorations) => new LineBlockNodeView(node, decorations),
        hashtag: (node, view, getPos) => new HashtagNodeView(node, view, getPos),
        ...nodes
      }
    })
  }, [])
  
  return (
    <div>
      <div id="editor-breadcrumb"></div>
      <div className="relative flex items-start">
        <div id="editor-gutter"></div>
        <Editor className="min-w-[220px]" onInit={onInit} /> 
      </div>
    </div>

  )
}, (prevProps, nextProps) => prevProps.renderId === nextProps.renderId)
