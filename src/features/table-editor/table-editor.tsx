import React, { useCallback, useMemo } from 'react'
import _ from 'lodash'
import { nanoid } from 'nanoid'
import { Popover } from '@ark-ui/react'
import { useDatabase, useQuery  } from '~/context/database-context';

import { DataSchemaValue, DataSchema, Entity, } from '~/types/db-types'
import { useAppStateService } from '../app-state';

import { TextCell, TitleCell } from './cells'
import { TableRow } from './row'

export const TableEditor = ({ entity }: { entity: Entity }) => {
  const db = useDatabase()
  const appState = useAppStateService()

  const dataSchema = useQuery<DataSchema>(
    "SELECT * FROM data_schema WHERE id = ?",
    [entity.data_schema_id],
    {
      takeFirst: true,
      jsonFields: ['schema'],
    }
  ).data;

  const records = useQuery<Entity[]>(
    "SELECT * FROM entity WHERE data_schema_id = ? AND type = ?",
    [dataSchema.id, 'document'],
    {
      jsonFields: ['data'],
    }
  ).data

  const onInsertRow = useCallback(async () => {
    const defaultData = {}
    await db.execute(`INSERT INTO entity (title, type, data_schema_id, data) VALUES ('', 'document', ?, ?)`, [dataSchema.id, JSON.stringify(defaultData)])
  }, [dataSchema.id])

  const onUpdateRowColumn = async (rowId: number, columnId: string, value: any) => {
    const schemaColumn = dataSchema.schema.columns.find((column) => column.id === columnId)
  
    if (schemaColumn?.type === 'title') {
      await db.execute('UPDATE entity SET title = ? WHERE id = ?', [value, rowId])
    } else {
      await db.execute(`UPDATE entity SET data = json_set(data, ?, ?) WHERE id = ?`, [`$.${columnId}`, value, rowId])
    }

  }

  const onAddColumn = async () => {
    const record = await db.execute<DataSchema>("SELECT * FROM data_schema WHERE id = ?", [dataSchema.id], {
      takeFirst: true,
      jsonFields: ['schema']
    })
  
    record.schema.columns.push({
      id: nanoid(),
      name: 'placeholder',
      type: 'text',
    })
    await db.execute("UPDATE data_schema SET schema = ? WHERE id = ?", [JSON.stringify(record.schema), record.id])
  }

  const onUpdateSchema = async (fn: (schema: DataSchemaValue) => DataSchemaValue) => {
    const record = await db.execute<DataSchema>("SELECT * FROM data_schema WHERE id = ?", [dataSchema.id], {
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
              {dataSchema.schema?.columns.map((column) => (
                <th key={column.id} className="w-[250px]">
                  <Popover.Root positioning={{
                    offset: {
                      mainAxis: 0,
                    },
                    placement: 'bottom-start'
                  }}>
                    <Popover.Trigger asChild>
                      <button className='min-w-[24px] w-full text-left'>
                        {column.name || '_'} 
                      </button>
                    </Popover.Trigger>
                    <Popover.Positioner>
                      <Popover.Content className="bg-blue-500 p-2 shadow-md">
                        <div>
                          <div>
                            <input defaultValue={column.name} onBlur={(e) => onUpdateSchema((schema) => {
                              schema.columns = schema.columns.map((schemaColumn) => {
                                if (schemaColumn.id === column.id) {
                                  schemaColumn.name = e.target.value
                                }
                                return schemaColumn
                              })
                              return schema
                            })} />
                          </div>
                          <div className="m-3">
                            <div>
                              <button onClick={() => onUpdateSchema((schema) => {
                                schema.columns = schema.columns.map((schemaColumn) => {
                                  if (schemaColumn.id === column.id) {
                                    schemaColumn.type = 'number'
                                  }
                                  return schemaColumn
                                })
                                return schema
                              })}>Set Number</button>
                            </div>
                            <div>
                              <button onClick={() => onUpdateSchema((schema) => {
                                schema.columns = schema.columns.map((schemaColumn) => {
                                  if (schemaColumn.id === column.id) {
                                    schemaColumn.type = 'text'
                                  }
                                  return schemaColumn
                                })
                                return schema
                              })}>Set Text</button>
                            </div>
                          </div>
                          <div className='m-1'>
                            <button onClick={() => onUpdateSchema((schema) => {
                              schema.columns = schema.columns.filter((col) => col.id !== column.id)
                              return schema
                            })}>Delete</button>
                          </div>
                        </div>
                      </Popover.Content>
                    </Popover.Positioner>
                  </Popover.Root>
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
                  {dataSchema.schema?.columns.map((column) => {
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