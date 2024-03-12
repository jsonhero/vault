import { CellInput } from '../ui';
import { BaseCell } from './base-cell'

interface TextCellProps {
  row: any;
  column: any;
  value: any;
  onUpdate: (rowId: number, columnId: string, value: any) => any;
}
export const TextCell = ({
  row,
  column,
  value,
  onUpdate
}: TextCellProps) => {
  return (
    <BaseCell>
      <CellInput
        placeholder='Empty'
        defaultValue={value} 
        onBlur={(e) => onUpdate(row.id, column.id, e.target.value)} 
      />
    </BaseCell>
  )
}