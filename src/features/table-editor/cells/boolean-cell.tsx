import { Checkbox } from "@nextui-org/react";

import { BaseCell } from './base-cell'

interface BooleanCellProps {
  row: any;
  column: any;
  value: any;
  onUpdateRowColumn: (rowId: number, columnId: string, value: any) => any;
}
export const BooleanCell = ({
  row,
  column,
  value,
  onUpdateRowColumn
}: BooleanCellProps) => {
  return (
    <BaseCell>
      <Checkbox isSelected={value === 1 ? true : false}  onValueChange={(selected) => onUpdateRowColumn(row.id, column.id, selected)}/>
    </BaseCell>
  )
}