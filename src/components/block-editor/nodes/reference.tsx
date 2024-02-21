import { Node } from '~/lib/vault-prosemirror'
import { useNodeView, ReactNodeView  } from "~/lib/vault-prosemirror/react";
import { useTakeFirstDbQuery } from "~/query-manager";
import { useRootService } from "~/services/root.service";

const ReferenceComponent = () => {
  const { node } = useNodeView()

  const root = useRootService()

  const { data: entity } = useTakeFirstDbQuery({
    keys: [node.attrs.entityId],
    query: (db) => db.selectFrom('entity')
      .where('entity.id', '=', node.attrs.entityId)
      .selectAll('entity')
  })

  const onOpen = () => {
    if (entity) {
      root.windowService.addTab({
        type: 'entity_view',
        meta: {
          entityId: entity.id,
        },
        name: entity.title,
      })
    }
  }

  return (
    <button onClick={onOpen} className='inline-block text-red-500'>
      @{entity?.title || 'Untitled'}
    </button>
  )

}

export const ReferenceNode = Node.create({
  name: 'reference',
  spec() {
    return {
      inline: true,
      atom: true,
      group: 'inline',
      parseDOM: [
        { tag: 'reference' }
      ],
      attrs: {
        entityId: {
          default: null,
        }
      }
    }
  },
  nodeView(props) {
  
    return new ReactNodeView({
      ...props,
      component: ReferenceComponent,
      editor: this.editor,
    })
  },
})