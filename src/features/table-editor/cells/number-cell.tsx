import { NumberInput } from '@ark-ui/react'

import { BaseCell } from './base-cell'

interface NumberCellProps {
  row: any;
  column: any;
  value: any;
  onUpdate: (rowId: number, columnId: string, value: any) => any;
}
export const NumberCell = ({
  row,
  column,
  value,
  onUpdate
}: NumberCellProps) => {
  return (
    <BaseCell>
      <NumberInput.Root defaultValue={value} onValueChange={(d) => onUpdate(row.id, column.id, d.value)}>
        <NumberInput.Input
          className="bg-transparent w-full focus-visible:outline-none focus-visible:border-none outline-none border-none"
        />
      </NumberInput.Root>
    </BaseCell>
  )
}