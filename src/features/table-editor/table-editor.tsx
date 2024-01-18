import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import _ from 'lodash'
import { nanoid } from 'nanoid'
import { Popover } from '@ark-ui/react'
import { useDatabase, useQuery  } from '~/context/database-context';

import { DataSchemaValue, DataSchema, Entity, } from '~/types/db-types'
import { useAppStateService } from '../app-state';
import { useQueryManager, useService } from '~/query-manager'
import { TableEditorService } from './table-editor.service'

import { TextCell, TitleCell, NumberCell, BooleanCell } from './cells'
import { TableRow } from './row'
import { HeaderPopover } from './header'
import { useEffectOnce } from '~/lib/create-effect-once'
import { observer } from 'mobx-react-lite';

export const TableEditor = observer(({ entity }: { entity: Entity }) => {
  // const db = useDatabase()
  // const appState = useAppStateService()
  const manager = useQueryManager()

  const service = useService(() => {
    const s = new TableEditorService(manager)
    console.log('creating :: ', s.id)
    return s
  })

  useEffect(() => {
    console.log('service changed!')
  }, [service.id])

  console.log(service.id)

  const { data: dataSchema } = service.schemaQuery
  // const { data: records } = service.recordsQuery

  useEffect(() => {
    service.schemaQuery.updateFetchParams(entity.data_schema_id)
    // service.recordsQuery.updateFetchParams(entity.data_schema_id)
  }, [entity.data_schema_id])

  useEffect(() => {
    return () => {
      console.log('untmounting')
    }
  }, [])

  useEffectOnce(() => {
    return () => {
      console.log('disposing!!')
      service.dispose()
    }
  })

  return null

  const onUpdateRowColumn = async (rowId: number, columnId: string, value: any) => {
    // const schemaColumn = dataSchema.schema.columns.find((column) => column.id === columnId)
  
    // if (schemaColumn?.type === 'title') {
    //   await db.execute('UPDATE entity SET title = ? WHERE id = ?', [value, rowId])
    // } else {
    //   await db.execute(`UPDATE entity SET data = json_set(data, ?, ?) WHERE id = ?`, [`$.${columnId}`, value, rowId])
    // }

  }

  // const onAddColumn = async () => {
  //   const record = await db.execute<DataSchema>("SELECT * FROM data_schema WHERE id = ?", [dataSchema.id], {
  //     takeFirst: true,
  //     jsonFields: ['schema']
  //   })
  
  //   record.schema.columns.push({
  //     id: nanoid(),
  //     name: 'placeholder',
  //     type: 'text',
  //   })
  //   await db.execute("UPDATE data_schema SET schema = ? WHERE id = ?", [JSON.stringify(record.schema), record.id])
  // }

  const onUpdateSchema = async (fn: (schema: DataSchemaValue) => DataSchemaValue) => {
    const record = await db.execute<DataSchema>("SELECT * FROM data_schema WHERE id = ?", [dataSchema?.id], {
      takeFirst: true,
      jsonFields: ['schema']
    })

    const modifiedSchema = fn(record.schema)
    await db.execute("UPDATE data_schema SET schema = ? WHERE id = ?", [JSON.stringify(modifiedSchema), record.id])
  }

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
                <button onClick={service.addColumn}>+</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* {
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
            } */}
            <tr>
              <td colSpan={2}>
                <button onClick={service.insertRow} className="w-full text-blue-800">
                  Add Row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
})