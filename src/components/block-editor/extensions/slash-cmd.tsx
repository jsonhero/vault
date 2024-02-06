import { forwardRef, useMemo, useState } from "react";
import { PluginKey } from "prosemirror-state";
import { Menu } from "@ark-ui/react";
import { InputRule, inputRules } from "prosemirror-inputrules";
import { nanoid } from 'nanoid'

import { Extension } from "~/lib/vault-prosemirror";
import { SuggestionExtension, openSuggestion, SuggestionPopover, closeSuggestion } from './suggestion'
import { rootService } from "~/services/root.service";
import { useDbQuery } from "~/query-manager";
import { tableEditorService } from "~/services/table.service";
import { EditorView } from "prosemirror-view";

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
      .selectAll('entity')
  })

  const { data: tables } = useDbQuery({
    query: (db) => db.selectFrom('entity')
      .where('type', '=', 'table')
      .selectAll()
  })


  const commands = useMemo(() => {
    const tableCmds = tables.map((t) => ({
      type: "table-cmd",
      cmd: `table:${t.title}`,
      data: t,
    }))
    const extCmds = extensions.map((ext) => ({
      type: 'ext-cmd',
      cmd: ext.props.prosemirror.command,
      data: ext,
    }))
    return [...tableCmds, ...extCmds]
  }, [tables, extensions])

  const upHandler = () => {
    setSelectedIndex((selectedIndex + commands.length - 1) % commands.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % commands.length)
  }
  
  const enterHandler = async () => {
    const view = props.view
    const cmd = commands[selectedIndex]
    closeSuggestion(SlashSuggestionPluginKey, view, true)

    const anchor = view.state.selection.anchor
    const node = view.state.selection.$anchor.parent
    const textOffset = view.state.selection.$anchor.parentOffset
    const diff = node.textContent.length - textOffset

    const schema = view.state.schema

    const pos = diff + anchor + 2


    if (cmd.type === 'table-cmd') {
      const table = cmd.data
      const entityRow = await tableEditorService.insertRow(table.data_schema_id)
      
      const entityRecord = schema.nodes.entity_record.create({
        entityId: entityRow?.id,
      }, null)

      const newNode = schema.nodes.lineblock.create({
        blockId: blockId(),
      },
        entityRecord
      )

      const tr = view.state.tr.insert(pos, newNode)

      view.dispatch(tr)
    }

    if (cmd.type === 'ext-cmd') {
      const extension = cmd.data
  
      const table = data.find((d) => d.extension_id === extension?.props.id)
      if (table?.data_schema_id) {
        const entityRow = await tableEditorService.insertRow(table.data_schema_id)
  
        const newNode = schema.nodes.lineblock.create({
          blockId: blockId(),
        },
          schema.nodes.todo.create({
            entityId: entityRow?.id
          },schema.nodes.paragraph.create(null))
        )
  
        const tr = view.state.tr.insert(pos, newNode)
        view.dispatch(tr)
      }

    }



  }

  return (
    <SuggestionPopover
      ref={ref}
      hasData={commands.length > 0}
      upHandler={upHandler}
      downHandler={downHandler}
      enterHandler={enterHandler}
      {...props}
    >
      {commands.map((item, i) => {
        const extraProps: any = {}

        if (i === selectedIndex) {
          extraProps['data-highlighted'] = true
        }
        return (
          <Menu.Item key={i} className="text-white p-2 data-[highlighted]:text-slate-400" {...extraProps}>{item.cmd}</Menu.Item>
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

    tr = openSuggestion(SlashSuggestionPluginKey, state, tr, '', {
      from: _start,
      to: tr.mapping.map(end)
    })

    return tr
  })
}

export const SlashCmdExtension = Extension.create({
  proseMirrorPlugins() {
    return [
      inputRules({
        rules: [createSlashRule()]
      }),
    ]
  },
  extensions() {
    return [
      SuggestionExtension.configure({
        key: SlashSuggestionPluginKey,
        component: SlashSuggestionComponent
      })
    ]
  },
})