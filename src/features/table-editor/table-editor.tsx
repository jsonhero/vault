import { useCallback } from 'react'
import _ from 'lodash'

import { DataSchemaValue, Entity, } from '~/types/db-types'
import { useAppStateService } from '../app-state';
import { useTakeFirstDbQuery, useDbQuery } from '~/query-manager'

import { TextCell, TitleCell, NumberCell, BooleanCell } from './cells'
import { TableRow } from './row'
import { HeaderPopover } from './header'
import { tableEditorService } from '~/services/table.service'
import { dataSchemaService } from '~/services/data-schema.service';

export const TableEditor = ({ entity }: { entity: Entity }) => {
  const appState = useAppStateService()

  const { data: dataSchema } = useTakeFirstDbQuery({
    keys: [entity.data_schema_id],
    query: (db) => db.selectFrom('data_schema')
      .where('id', '=', entity.data_schema_id)
      .selectAll()
  })

  const { data: records } = useDbQuery({
    keys: [entity.data_schema_id],
    query: (db) => db.selectFrom('entity')
      .where('data_schema_id', '=', entity.data_schema_id)
      .where('type', '=', 'document')
      .selectAll()
  })

  const onUpdateRowColumn = useCallback((rowId: number, columnId: string, value: any) => {
    tableEditorService.updateCell(entity.data_schema_id, rowId, columnId, value)
  }, [entity.data_schema_id])

  const onAddColumn = useCallback(() => {
    tableEditorService.addColumn(entity.data_schema_id)
  }, [entity.data_schema_id])

  const onInsertRow = useCallback(() => {
    tableEditorService.insertRow(entity.data_schema_id)
  }, [entity.data_schema_id])

  const onUpdateSchema = useCallback(async (fn: (schema: DataSchemaValue) => DataSchemaValue) => {
    const record = await dataSchemaService.findById(entity.data_schema_id)
    const modifiedSchema = fn(record.schema)
    dataSchemaService.update(record.id, modifiedSchema)
  }, [entity.data_schema_id])

  return (
    <div className="p-2 w-full">
      <div className="w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="w-[50px]">
                ID
              </th>
              {dataSchema?.schema?.columns.map((column) => (
                <th key={column.id} className="w-[250px]">
                  <HeaderPopover dataSchema={dataSchema} column={column} onUpdateSchema={onUpdateSchema} />
                </th>
              ))}
              <th className="min-w-[70px] flex-1 text-left">
                <button onClick={onAddColumn}>+</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {
              records.map((row) => (
                <TableRow key={row.id} className="border-b">
                  <td>
                    {row.id}
                  </td>
                  {dataSchema?.schema?.columns.map((column) => {
                    const value = _.get(row.data, column.id)

                    let component;

                    if (column.type === 'title') {
                      component = (
                        <TitleCell 
                          column={column} 
                          row={row} 
                          onUpdateRowColumn={onUpdateRowColumn} 
                          setSelectedEntityId={appState.setSelectedEntityId} 
                        />
                      )
                    } else if (column.type === 'text') {
                      component = (
                        <TextCell
                          column={column} 
                          row={row} 
                          onUpdateRowColumn={onUpdateRowColumn}
                          value={value}
                        />
                      )
                    } else if (column.type === 'number') {
                      component = (
                        <NumberCell
                          column={column} 
                          row={row} 
                          onUpdateRowColumn={onUpdateRowColumn}
                          value={value}
                        />
                      )
                    } else if (column.type === 'boolean') {
                      component = (
                        <BooleanCell
                          column={column} 
                          row={row} 
                          onUpdateRowColumn={onUpdateRowColumn}
                          value={value}
                        />
                      )
                    } else {
                      component = value
                    }

                    return (
                      <td className="border-r border-l" key={column.id}>
                        {component}
                      </td>
                    )
                  })}
                </TableRow>
              ))
            }
            <tr>
              <td colSpan={2}>
                <button onClick={onInsertRow} className="w-full text-blue-800">
                  Add Row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}