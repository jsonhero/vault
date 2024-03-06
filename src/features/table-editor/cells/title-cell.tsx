import { CellInput } from '../ui';
import { BaseCell } from './base-cell'

interface TitleCellProps {
  row: any;
  column: any;
  onUpdate: (rowId: number, columnId: string, value: any) => any;
  setSelectedEntityId: (entityId: number) => void;
}

export const TitleCell = ({
  row,
  column,
  onUpdate,
  setSelectedEntityId,
}: TitleCellProps) => {
  return (
    <BaseCell className="group">
      <CellInput 
        defaultValue={row.title} 
        onBlur={(e) => onUpdate(row.id, column.id, e.target.value)} 
      />
      <div className="hidden group-hover:block absolute right-0">
        <button onClick={() => setSelectedEntityId(row.id)}>Open</button>
      </div>
    </BaseCell>
  )
}