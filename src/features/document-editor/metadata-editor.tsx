import _ from 'lodash'

import {
  BooleanCell,
  NumberCell,
  TextCell,
  TitleCell
} from '~/features/table-editor/cells'
import { useTakeFirstDbQuery } from "~/query-manager"
import { tableEditorService } from "~/services/table.service"
import { columnTypeToIcon } from '../table-editor/utils'
import { HeaderPopover } from '../table-editor/header'
import { useCallback } from 'react'
import { dataSchemaService } from '~/services/data-schema.service'
import { DataSchemaValue } from '~/types/db-types'


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

  const onUpdateSchema = useCallback(async (fn: (schema: DataSchemaValue) => DataSchemaValue) => {
    if (entity?.data_schema_id) {
      const record = await dataSchemaService.findById(entity.data_schema_id)
      const modifiedSchema = fn(record.schema)
      dataSchemaService.update(record.id, modifiedSchema)
    }
  }, [entity?.data_schema_id])
  
  if (!entity) return null;


  return (
    <div className="mb-6">
      {/* <button className="border-1 rounded-sm flex items-center justify-center w-fit p-1 ">
        {entity.table_title}
      </button> */}
      <table className="border-collapse table-fixed">
        <tbody>
          {entity.schema.columns.filter((column) => column.type !== 'title').map((column) => {
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

            console.log(column, value, 'column')

            return (
              <tr>
                <td className="p-0 flex items-center text-muted w-[200px] h-[38px]">
                  <HeaderPopover 
                    column={column}
                    dataSchema={{
                      id: entity.data_schema_id!,
                      schema: entity.schema,
                    }}
                    onUpdateSchema={onUpdateSchema}
                  />
                </td>
                <td className='p-0 w-full hover:bg-interactiveHover h-[38px]'>
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