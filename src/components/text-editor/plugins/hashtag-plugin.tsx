import { EditorState, Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { InputRule, inputRules } from "prosemirror-inputrules";
import { NodeRange } from "prosemirror-model";
import { ProseMirrorReactPlugin } from '~/lib/prosemirror-react'
import { openSuggestion, SuggestionPopover, createSuggestionPlugin } from './suggestion-plugin'
import { schema } from "../schema";
import { forwardRef, useEffect, useState } from "react";
import { useDbQuery } from "~/query-manager";
import { sql } from "kysely";
import { Menu } from "@ark-ui/react";

const nodePluginKey = new PluginKey('suggest-decor')
const nodeSuggestionKey = new PluginKey('hashtag-suggestion')


const HashtagSuggestionComponent = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const { data } = useDbQuery({
    keys: [props.query],
    // will be terrible performance but yolo for now
    query: () => sql<{ tag: string }>`SELECT DISTINCT item.value as tag
      FROM document,
      json_each(manifest, '$.taggedBlocks' ) as block,
      json_each(json_extract(block.value, '$.tags')) as item
      WHERE item.value LIKE ${sql.val('%' + props.query + '%')}
      ORDER BY tag DESC
      LIMIT 6
      `,
    enabled: props.query.length > 0,
  })

  useEffect(() => {
    setSelectedIndex(0)
  }, [data])

  const upHandler = () => {
    setSelectedIndex((selectedIndex + data.length - 1) % data.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % data.length)
  }

  const enterHandler = () => {
    const view = props.view

    const node = view.state.selection.$anchor.parent
    const anchor = view.state.selection.anchor

    const textOffset = view.state.selection.$anchor.parentOffset
  
    const diff = node.textContent.length - textOffset

    const from = anchor - textOffset + 1
    const to = diff + anchor

    const entry = data[selectedIndex]

    const tr = view.state.tr.insertText(entry.tag, from, to)
    view.dispatch(tr)

    const offset = from + entry.tag.length
    view.dispatch(view.state.tr.insertText(' ', offset + 1))
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, offset + 2)))  
  }

  return (
    <SuggestionPopover
      ref={ref}
      hasData={data.length > 0}
      enterHandler={enterHandler}
      upHandler={upHandler} 
      downHandler={downHandler} 
      {...props}
    >
      {data.map((item, i) => {
        const extraProps: any = {}

        if (i === selectedIndex) {
          extraProps['data-highlighted'] = true
        }
        return (
          <Menu.Item key={i} className="text-white p-2 data-[highlighted]:text-slate-400" {...extraProps}>{item.tag}</Menu.Item>
        )
      })}
    </SuggestionPopover>
  )
})

function createHashtagRule() {

  // input rules might not be the move, they seem to block user input if typing too fast...
  return new InputRule(/(?:^|\s)(#[a-zA-Z0-9])$/, (state, match, start, end) => {
    if (inHashtagNode(state)) {
      return null
    }
  
    let tr = state.tr


    const $start = state.doc.resolve(match[0].startsWith(' ') ? start + 1 : start)

    const $end = state.doc.resolve(end)
    const range = new NodeRange($start, $end, $start.depth)

    if (range) {
      const meta = { action: 'add' }
      tr.setMeta(nodePluginKey, meta)
      tr = tr.wrap(range, [{ type: schema.nodes.hashtag }])
      tr = tr.insertText(match[1][match[1].length - 1], tr.mapping.map(end) - 1).scrollIntoView()
      tr = tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map(end) - 1))
    }

    tr = openSuggestion(nodeSuggestionKey, state, tr, '#', {
      from: tr.mapping.map(start),
      to: tr.mapping.map(end)
    })

    return tr
  })
}

function inHashtagNode(state: EditorState) {
  return state.selection.$anchor.parent.type.name === 'hashtag'
}

const nodePlugin: Plugin = new Plugin({
  key: nodePluginKey,

  props: {
    handleTextInput(view, text) {
      const meta =  view.state.tr.getMeta(nodePluginKey)
      const aheadPos = view.state.selection.from
      
      const nodeAhead = view.state.doc.nodeAt(aheadPos)
      if (nodeAhead?.type.name === 'hashtag' && meta?.action !== 'add') {
        view.dispatch(view.state.tr.replace(aheadPos, aheadPos + nodeAhead.nodeSize, nodeAhead.slice(0)))
        return false
      }
      
      if (!inHashtagNode(view.state)) return false

      const node = view.state.selection.$anchor.parent
      const anchor = view.state.selection.anchor

      const textOffset = view.state.selection.$anchor.parentOffset
    
      const diff = node.textContent.length - textOffset

      const from = anchor - textOffset
      const to = diff + anchor

      openSuggestion(nodeSuggestionKey, view.state, view.state.tr, '#', { to, from }, view.dispatch)

    },
    handleKeyDown(view, event) {
      if (!inHashtagNode(view.state)) return false
      const node = view.state.selection.$anchor.parent

      // remove hash
      const text = node.textContent.slice(1)

      if (event.key === ' ' || event.key === 'Spacebar') {
        view.dispatch(view.state.tr.insertText(' ', view.state.selection.anchor + 1))
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, view.state.selection.anchor + 2)))        
        return true
      }

      if (text.length === 1 && event.key === 'Backspace') {
        const anchor = view.state.selection.anchor
        view.dispatch(view.state.tr.delete(anchor - 3, anchor))
        view.dispatch(view.state.tr.insertText('#'))
        return true
      }

      return false
    }
  }
})


export const hashtagPlugin = ProseMirrorReactPlugin.create({
  name: 'hashtagplugin',
  buildPlugin(editor) {

    const suggestionPlugin = createSuggestionPlugin({
      component: HashtagSuggestionComponent,
      key: nodeSuggestionKey,
      editor,
    })
    return [
      nodePlugin,
      inputRules({
        rules: [createHashtagRule()]
      }),
      suggestionPlugin,
    ]
  },
})
