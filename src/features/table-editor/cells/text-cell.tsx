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
      <input 
        defaultValue={value} 
        onBlur={(e) => onUpdate(row.id, column.id, e.target.value)} 
        className="bg-transparent w-full focus-visible:outline-none focus-visible:border-none outline-none border-none"
      />
    </BaseCell>
  )
}