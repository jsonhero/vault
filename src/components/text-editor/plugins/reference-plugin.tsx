import { forwardRef, useMemo, useState } from "react";
import { PluginKey } from "prosemirror-state";
import { Menu } from "@ark-ui/react";
import { InputRule, inputRules } from "prosemirror-inputrules";
import { nanoid } from 'nanoid'

import { ProseMirrorReactPlugin } from "~/lib/prosemirror-react";
import { createSuggestionPlugin, openSuggestion, SuggestionPopover, closeSuggestion } from './suggestion-plugin'
import { rootService } from "~/services/root.service";
import { useDbQuery } from "~/query-manager";
import { tableEditorService } from "~/services/table.service";
import { EditorView } from "prosemirror-view";
import { schema } from "../schema";


const blockId = () => nanoid(5)

const ReferencePluginKey = new PluginKey('ReferenceSuggestionPlugin')

const ReferenceSuggestionComponent = forwardRef((props: { view: EditorView }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  
  const query = props.query.slice(1)

  const { data: entities } = useDbQuery({
    keys: [query],
    query: (db) => db.selectFrom('entity')
      .where('title', 'like', query + '%')
      .selectAll(),
    enabled: query.length > 0
  })


  const upHandler = () => {
    setSelectedIndex((selectedIndex + entities.length - 1) % entities.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % entities.length)
  }
  
  const enterHandler = async () => {
    const view = props.view
    closeSuggestion(ReferencePluginKey, view, true)

    const entity = entities[selectedIndex]

    const ref = schema.nodes.reference.create({
      entityId: entity.id,
    }, null)

    const tr = view.state.tr.insert(view.state.selection.anchor, ref).insertText(' ')

    view.dispatch(tr)
  }

  return (
    <SuggestionPopover
      ref={ref}
      hasData={entities.length > 0}
      upHandler={upHandler}
      downHandler={downHandler}
      enterHandler={enterHandler}
      {...props}
    >
      {entities.map((entity, i) => {
        const extraProps: any = {}

        if (i === selectedIndex) {
          extraProps['data-highlighted'] = true
        }
        return (
          <Menu.Item key={i} className="text-white p-2 data-[highlighted]:text-slate-400" {...extraProps}>
            {entity.title}
          </Menu.Item>
        )
      })}
    </SuggestionPopover>
  )
})

function createRefRule() {

  // input rules might not be the move, they seem to block user input if typing too fast...
  return new InputRule(/(?:^|\s)(@)$/, (state, match, start, end) => {
    let tr = state.tr
    const _start = match[0].startsWith(' ') ? start + 1 : start
    tr = state.tr.insertText('@')

    tr = openSuggestion(ReferencePluginKey, state, tr, '', {
      from: _start,
      to: tr.mapping.map(end)
    })

    return tr
  })
}

export const referencePlugin = ProseMirrorReactPlugin.create({
  name: 'referenceplugin',
  buildPlugin(editor) {
    const suggestionPlugin = createSuggestionPlugin({
      editor,
      key: ReferencePluginKey,
      component: ReferenceSuggestionComponent,
    })

    return [
      inputRules({
        rules: [createRefRule()]
      }),
      suggestionPlugin
    ]
  },
})
