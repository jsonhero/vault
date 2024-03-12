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
import { HeaderButton, RowHoverControl } from './ui'
import { GripVerticalIcon } from 'lucide-react';
import { Menu } from '@ark-ui/react';
import { Button } from '~/components/ui/button';


export const TableEditor = ({ entity }: { entity: Entity }) => {
  const appState = useAppStateService()

  const { data: dataSchema } = useTakeFirstDbQuery({
    keys: [entity.data_schema_id],
    query: (db) => db.selectFrom('data_schema')
      .where('id', '=', entity.data_schema_id)
      .selectAll(),
    reactiveRowId: BigInt(entity.data_schema_id),
    reactiveTableName: 'data_schema'
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
    <div className="w-full">
      <table className="w-full border-separate border-spacing-0 table-fixed px-16 pb-20">
        <thead>
          <tr>
            <th className='w-[30px] left-0 bg-primary z-10'></th>
            <th className="bg-primary sticky top-0 z-50 w-[50px] border-l-0 border-b border-t border-muted w-[250px] border-r border-muted">
              ID
            </th>
            {dataSchema?.schema?.columns.map((column) => (
              <th key={column.id} className="z-50 bg-primary sticky top-0 border-l-0 border-b border-t border-muted w-[250px] border-l border-r border-muted last:border-r-0">
                <HeaderPopover dataSchema={dataSchema} column={column} onUpdateSchema={onUpdateSchema} />
              </th>
            ))}
            <th className="bg-primary z-50 sticky top-0 border-b border-l-0 border-t border-muted w-[100px] flex-1 text-left">
              <HeaderButton onClick={onAddColumn}>+</HeaderButton>
            </th>
          </tr>
        </thead>
        <tbody>
          {
            records.map((row) => (
              <TableRow key={row.id} className='relative group'>
                <td className="left-0 bg-primary z-10">
                  <RowHoverControl entityId={row.id} />
                </td>
                <td className="border-b border-r border-muted border-l-0">
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
                        onUpdate={onUpdateRowColumn} 
                        setSelectedEntityId={appState.setSelectedEntityId} 
                      />
                    )
                  } else if (column.type === 'text') {
                    component = (
                      <TextCell
                        column={column} 
                        row={row} 
                        onUpdate={onUpdateRowColumn}
                        value={value}
                      />
                    )
                  } else if (column.type === 'number') {
                    component = (
                      <NumberCell
                        column={column} 
                        row={row} 
                        onUpdate={onUpdateRowColumn}
                        value={value}
                      />
                    )
                  } else if (column.type === 'boolean') {
                    component = (
                      <BooleanCell
                        column={column} 
                        row={row} 
                        onUpdate={onUpdateRowColumn}
                        value={value}
                      />
                    )
                  } else {
                    component = value
                  }

                  return (
                    <td className="border-l-0 [&:nth-child(3)]:bg-transparent last:border-r-0 border-b border-r border-l border-muted" key={column.id}>
                      {component}
                    </td>
                  )
                })}
                <td className="border-l-0 border-b border-muted"></td>
              </TableRow>
            ))
          }
          <tr>
            <td></td>
            <td className="border-b border-muted" colSpan={dataSchema?.schema?.columns.length + 2}>
              <Button onClick={onInsertRow} className="text-left w-full">
                Add Row
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}