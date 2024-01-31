import { Plugin } from "prosemirror-state"
import { 
  ProseMirrorReactPlugin,
  ProseMirrorReactNode,
  useNodeView,
} from "~/lib/prosemirror-react"

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

// inlay in markdown or just use block as source of truth...
// what if I want to do a search on a document and the text within each todo
const TodoComponent = () => {
  const { contentRef, node } = useNodeView()
  // const { data, update } = useBlockExtension<Todo>()

  return (
    <div className="flex items-center">
      <div>
        Check
      </div>
      <div ref={contentRef}></div>
      <div>
        due
      </div>
    </div>
  )
}

const TodoBlockNode = ProseMirrorReactNode.create({
  name: 'todo',
  component: TodoComponent
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