import { BaseCell } from './base-cell'

interface TextCellProps {
  row: any;
  column: any;
  value: any;
  onUpdateRowColumn: (rowId: number, columnId: string, value: any) => any;
}
export const TextCell = ({
  row,
  column,
  value,
  onUpdateRowColumn
}: TextCellProps) => {
  return (
    <BaseCell>
      <input 
        defaultValue={value} 
        onBlur={(e) => onUpdateRowColumn(row.id, column.id, e.target.value)} 
        className="bg-transparent w-full focus-visible:outline-none focus-visible:border-none outline-none border-none"
      />
    </BaseCell>
  )
}