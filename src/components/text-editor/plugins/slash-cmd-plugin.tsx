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

const SlashSuggestionPluginKey = new PluginKey('SlashSuggestionPlugin')

const SlashSuggestionComponent = forwardRef((props: { view: EditorView }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const extensions = useMemo(() => {
    return rootService.extensionService.extensions
  }, [])

  const extensionCommands = useMemo(() => {
    return rootService.extensionService.extensions.map((ext) => ext.props.prosemirror.command)
  }, [])

  const { data } = useDbQuery({
    query: (db) => db.selectFrom('entity')
      .where('type', '=', 'table')
      .where('extension_id', 'in', extensions.map((ext) => ext.props.id))
      // .innerJoin('data_schema', 'data_schema.id', 'entity.data_schema_id')
      .selectAll('entity')
      // .select('data_schema.schema')
  })


  const upHandler = () => {
    setSelectedIndex((selectedIndex + extensionCommands.length - 1) % extensionCommands.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % extensionCommands.length)
  }
  
  const enterHandler = async () => {
    const view = props.view
    const extensionId = extensionCommands[selectedIndex]
    const extension = extensions.find((ext) => ext.props.prosemirror.command === extensionId)

    const table = data.find((d) => d.extension_id === extension?.props.id)
    if (table?.data_schema_id) {
      const entityRow = await tableEditorService.insertRow(table.data_schema_id)

      const anchor = view.state.selection.anchor
      const node = view.state.selection.$anchor.parent
      const textOffset = view.state.selection.$anchor.parentOffset
      const diff = node.textContent.length - textOffset

      const pos = diff + anchor + 2

      const newNode = schema.nodes.lineblock.create({
        blockId: blockId(),
      },
        schema.nodes.todo.create({
          entityId: entityRow?.id
        }, schema.nodes.paragraph.create(null))
      )

      const tr = view.state.tr.insert(pos, newNode)
      view.dispatch(tr)
    }

    closeSuggestion(SlashSuggestionPluginKey, view)



  }

  return (
    <SuggestionPopover
      ref={ref}
      hasData={extensionCommands.length > 0}
      upHandler={upHandler}
      downHandler={downHandler}
      enterHandler={enterHandler}
      {...props}
    >
      {extensionCommands.map((cmd, i) => {
        const extraProps: any = {}

        if (i === selectedIndex) {
          extraProps['data-highlighted'] = true
        }
        return (
          <Menu.Item key={i} className="text-white p-2 data-[highlighted]:text-slate-400" {...extraProps}>{cmd}</Menu.Item>
        )
      })}
    </SuggestionPopover>
  )
})

function createSlashRule() {

  // input rules might not be the move, they seem to block user input if typing too fast...
  return new InputRule(/(?:^|\s)(\/)$/, (state, match, start, end) => {
    let tr = state.tr
    const _start = match[0].startsWith(' ') ? start + 1 : start
    tr = state.tr.insertText('/')

    tr.insert()

    tr = openSuggestion(SlashSuggestionPluginKey, state, tr, '', {
      from: _start,
      to: tr.mapping.map(end)
    })

    return tr
  })
}

export const slashPlugin = ProseMirrorReactPlugin.create({
  name: 'slashplugin',
  buildPlugin(editor) {
    const suggestionPlugin = createSuggestionPlugin({
      editor,
      key: SlashSuggestionPluginKey,
      component: SlashSuggestionComponent,
    })

    return [
      inputRules({
        rules: [createSlashRule()]
      }),
      suggestionPlugin
    ]
  },
})
