import React, { useState } from 'react'

import { inputRules, InputRule } from "prosemirror-inputrules"
import { EditorView } from 'prosemirror-view'
import { DOMParser, NodeRange } from 'prosemirror-model'
import { EditorState, Plugin as ProseMirrorPlugin, Transaction } from 'prosemirror-state'
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { keymap } from 'prosemirror-keymap';

import { Editor, EditorFactoryProps } from '~/lib/prosemirror-react'

import { LineBlockNodeView, HashtagNodeView } from './node-view'
import { schema } from './schema'
import { arrowHandler, createLineblockOnEnter, backspace } from './keymaps'
import { createLineBlockPlugin, hashtagPlugin, slashPlugin, gutterPlugin, referencePlugin } from './plugins'
import { EntityRecordNode, ReferenceNode } from './nodes'
import { nanoid } from 'nanoid'
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
