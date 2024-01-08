import { useNodeViewContext } from '@prosemirror-adapter/react'
import { useEffect, useRef } from 'react'
import { Table } from '~/features/table'

export const TableBlockNode = () => {
  const ref = useRef<HTMLDivElement>(null)

  const { node, selected } = useNodeViewContext()

  console.log(node.attrs, 'attrs', selected)

  useEffect(() => {
    if (selected) {
      ref.current?.focus()
    }
  }, [selected])

  return (
    <div className="w-full bg-red-500 min-h-9" contentEditable={false} ref={ref}>
      <Table tableId={node.attrs.entityId} />
    </div>
  )
}
