import { ProseMirrorReactNode, useNodeView } from "~/lib/prosemirror-react";
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
      @{entity?.title}
    </button>
  )

}

export const ReferenceNode = ProseMirrorReactNode.create({
  name: 'reference',
  component: ReferenceComponent,
})