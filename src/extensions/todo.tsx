import { Plugin } from "prosemirror-state"
// import { Checkbox } from '@ark-ui/react'

import { 
  ProseMirrorReactPlugin,
  ProseMirrorReactNode,
  useNodeView,
} from "~/lib/prosemirror-react"
import { useDbQuery, useTakeFirstDbQuery } from "~/query-manager";
import { CheckCheckIcon } from "lucide-react";
import { Checkbox } from "@nextui-org/react";
import { useEffect, useMemo } from "react";
import { tableEditorService } from "~/services/table.service";

type VaultExtensionProps = {
  id: string,
  data: {
    name: string,
    schema: any,
  };
  prosemirror: {
    plugins: ProseMirrorReactPlugin[],
    nodes: ProseMirrorReactNode[],
    command: string
  }
}


export class VaultExtension {
  props;
  constructor(props: VaultExtensionProps) {
    this.props = props
  }

  static create(props: VaultExtensionProps) {
    return new VaultExtension(props)
  }
}



const TodoBlockPlugin = ProseMirrorReactPlugin.create({
  name: 'todoplugin',
  buildPlugin(editor) {
    return new Plugin({

    })
  },
})


// when typing /todo
// create entity in table
// insert node at cmd position
// entity id is saved to node spec
// load entity by spec id in node 

// inlay in markdown or just use block as source of truth...
// what if I want to do a search on a document and the text within each todo
const TodoComponent = () => {
  const { contentRef, node, ...rest } = useNodeView()

  const { data: entity } = useTakeFirstDbQuery({
    keys: [node.attrs.entityId],
    query: (db) => db.selectFrom('entity')
      .where('entity.id', '=', node.attrs.entityId)
      .innerJoin('data_schema', 'data_schema.id', 'entity.data_schema_id')
      .selectAll('entity')
      .select('data_schema.schema'),
    reactiveRowId: node.attrs.entityId,
    reactiveTableName: 'entity'
  })

  const descCol = useMemo(() => entity?.schema.columns.find((col) => col.name === 'Description'), [entity?.schema])

  useEffect(() => {
    if (descCol && entity && entity.data) {
      const value = entity.data[descCol.id]

      if (value !== node.textContent && node.textContent.length) {
        tableEditorService.updateCell(
          entity.data_schema_id!,
          entity.id,
          descCol.id,
          node.textContent
        )
        console.log('updating cell')
      }
    }
  }, [node.textContent, entity?.data_schema_id, entity?.id, descCol])

  // const { data, update } = useBlockExtension<Todo>()

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div contentEditable={false}>
          <Checkbox />
        </div>
        <div className="min-w-[2px]" ref={contentRef}>

        </div>
      </div>
      <div contentEditable={false}>
        due
      </div>
    </div>
  )
}

const TodoBlockNode = ProseMirrorReactNode.create({
  name: 'todo',
  component: TodoComponent,
})

export const todoExtension = VaultExtension.create({
  id: 'todos',
  data: {
    name: 'Todo',
    schema: {
      columns: [
        {
          name: 'Completed',
          type: 'boolean'
        },
        {
          name: 'Description',
          type: 'text'
        }
      ]
    }
  },
  prosemirror: {
    plugins: [TodoBlockPlugin],
    nodes: [TodoBlockNode],
    command: 'todo',
  }
})

// When app loads
// Check for extensions
// If extension has never "initialized", then init it
// Init will: build data schema, save to db
// then load plugins into prosemirror

// entity.extension_id = blah
// initialized extensions = [] (app state?)
// 