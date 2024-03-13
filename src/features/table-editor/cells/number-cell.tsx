import { NumberInput } from '@ark-ui/react'

import { BaseCell } from './base-cell'
import { CellInput } from '../ui';

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
      <NumberInput.Root 
        className='w-full h-full'
        defaultValue={value} 
        onValueChange={(d) => onUpdate(row.id, column.id, d.value)}
      >
        <NumberInput.Input
          asChild
        >
          <CellInput placeholder='Empty' />
        </NumberInput.Input>
      </NumberInput.Root>
    </BaseCell>
  )
}