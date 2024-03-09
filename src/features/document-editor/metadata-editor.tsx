import _ from 'lodash'

import {
  BooleanCell,
  NumberCell,
  TextCell,
  TitleCell
} from '~/features/table-editor/cells'
import { useTakeFirstDbQuery } from "~/query-manager"
import { tableEditorService } from "~/services/table.service"


export const MetadataEditor = ({
  entityId,
}) => {
  const { data: entity } = useTakeFirstDbQuery({
    keys: [entityId],
    query: (db) => db.selectFrom('entity')
      .where('entity.id', '=', entityId)
      .innerJoin('data_schema', 'data_schema.id', 'entity.data_schema_id')
      .innerJoin('entity as table_entity', 'table_entity.data_schema_id', 'data_schema.id')
      .selectAll('entity')
      .select(['data_schema.schema', 'table_entity.title as table_title'])
  })

  const onUpdateCell = (rowId: number, columnId: string, value: any) => {
    if (entity?.data_schema_id) {
      tableEditorService.updateCell(
        entity.data_schema_id,
        rowId,
        columnId,
        value,
      )
    }
  }
  
  if (!entity) return null;


  return (
    <div className="mb-6">
      {/* <button className="border-1 rounded-sm flex items-center justify-center w-fit p-1 ">
        {entity.table_title}
      </button> */}
      <table className="border-collapse mt-2">
        <tbody>
          {entity.schema.columns.map((column) => {
            const value = _.get(entity.data, column.id)

            let component;

              if (column.type === 'title') {
                component = (
                  <TitleCell 
                    column={column} 
                    row={entity} 
                    onUpdate={onUpdateCell} 
                    // setSelectedEntityId={appState.setSelectedEntityId} 
                  />
                )
              } else if (column.type === 'text') {
                component = (
                  <TextCell
                    column={column} 
                    row={entity} 
                    onUpdate={onUpdateCell}
                    value={value}
                  />
                )
              } else if (column.type === 'number') {
                component = (
                  <NumberCell
                    column={column} 
                    row={entity} 
                    onUpdate={onUpdateCell}
                    value={value}
                  />
                )
              } else if (column.type === 'boolean') {
                component = (
                  <BooleanCell
                    column={column} 
                    row={entity} 
                    onUpdate={onUpdateCell}
                    value={value}
                  />
                )
              } else {
                component = value
              }

            return (
              <tr>
                <td className="pr-4 flex">
                  <div>
                    
                  </div>
                  <div className="text-muted">
                    {column.name}
                  </div>
                </td>
                <td>
                  {component}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}