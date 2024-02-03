import _ from 'lodash'
import { ProseMirrorReactNode, useNodeView } from "~/lib/prosemirror-react";
import { useTakeFirstDbQuery } from "~/query-manager";


import {
  BooleanCell,
  NumberCell,
  TextCell,
  TitleCell
} from '~/features/table-editor/cells'
import { tableEditorService } from '~/services/table.service';

const EntityRecordComponent = () => {
  const { node, view } = useNodeView()

  const { data: entity } = useTakeFirstDbQuery({
    keys: [node.attrs.entityId],
    query: (db) => db.selectFrom('entity')
      .where('entity.id', '=', node.attrs.entityId)
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

  return (
    <div>
      <div>
        {entity?.table_title || 'Placeholder'}
      </div>
      <table className="w-full border-collapse" contentEditable={false}>
        <thead>
          <tr className="border-b">
            {entity?.schema.columns.map((col) => (
              <th key={col.id}>
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            {entity?.schema.columns.map((column) => {
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
                <td className="border-r border-l" key={column.id}>
                  {component}
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )

}

export const EntityRecordNode = ProseMirrorReactNode.create({
  name: 'entity_record',
  component: EntityRecordComponent,
})