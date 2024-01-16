import { BaseCell } from './base-cell'

interface TitleCellProps {
  row: any;
  column: any;
  onUpdateRowColumn: (rowId: number, columnId: string, value: any) => any;
  setSelectedEntityId: (entityId: number) => void;
}

export const TitleCell = ({
  row,
  column,
  onUpdateRowColumn,
  setSelectedEntityId,
}: TitleCellProps) => {
  return (
    <BaseCell className="group">
      <input 
        defaultValue={row.title} 
        onBlur={(e) => onUpdateRowColumn(row.id, column.id, e.target.value)} 
        className="bg-transparent w-full focus-visible:outline-none focus-visible:border-none outline-none border-none"
      />
      <div className="hidden group-hover:block">
        <button onClick={() => setSelectedEntityId(row.id)}>Open</button>
      </div>
    </BaseCell>
  )
}