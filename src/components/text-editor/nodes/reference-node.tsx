import { ProseMirrorReactNode, useNodeView } from "~/lib/prosemirror-react";
import { useTakeFirstDbQuery } from "~/query-manager";

const ReferenceComponent = () => {
  const { node } = useNodeView()

  const { data: entity } = useTakeFirstDbQuery({
    keys: [node.attrs.entityId],
    query: (db) => db.selectFrom('entity')
      .where('id', '=', node.attrs.entityId)
      .selectAll()
  })


  return <div className="inline-block text-red-500">{entity?.title || 'placeholder'}</div>
}

export const ReferenceNode = ProseMirrorReactNode.create({
  name: 'reference',
  component: ReferenceComponent,
})