import { useNodeViewContext } from '@prosemirror-adapter/react'
import { useEffect, useRef } from 'react'
import { EntityEditor } from '~/features/entity-editor'

export const TableBlockNode = () => {
  const ref = useRef<HTMLDivElement>(null)

  const { node, selected } = useNodeViewContext()

  useEffect(() => {
    if (selected) {
      ref.current?.focus()
    }
  }, [selected])

  return (
    <div className="w-full bg-red-500 min-h-9" contentEditable={false} ref={ref}>
      <EntityEditor entityId={node.attrs.entityId} />
    </div>
  )
}
