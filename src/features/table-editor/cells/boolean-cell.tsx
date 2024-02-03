import { Checkbox } from "@nextui-org/react";

import { BaseCell } from './base-cell'

interface BooleanCellProps {
  row: any;
  column: any;
  value: any;
  onUpdate: (rowId: number, columnId: string, value: any) => any;
}
export const BooleanCell = ({
  row,
  column,
  value,
  onUpdate
}: BooleanCellProps) => {
  return (
    <BaseCell>
      <Checkbox isSelected={value === 'true' ? true : false}  onValueChange={(selected) => onUpdate(row.id, column.id, selected)}/>
    </BaseCell>
  )
}