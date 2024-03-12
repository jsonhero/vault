import { Popover, Select, Portal } from "@ark-ui/react"
import { Pencil, Trash, ChevronDownIcon, ArrowLeftIcon } from "lucide-react";

import { useCallback, useMemo, useState } from "react";
import { Input } from '~/components/input'

import { DataSchema, DataSchemaValue } from "~/types/db-types";

import { columnTypeToIcon } from '../utils'
import { Button } from "~/components/ui/button";
import { HeaderButton } from '../ui'

interface HeaderPopoverProps {
  column: any;
  onUpdateSchema: (fn: (schema: DataSchemaValue) => DataSchemaValue) => void
  dataSchema: DataSchema
}

interface EditPropertyViewProps {
  onBack: () => void;
  value: string;
  onUpdateType: (type: string) => void;
}

const columnTypeItems = [
  {
    value: 'text',
    label: 'Text'
  },
  {
    value: 'number',
    label: 'Number',
  },
  {
    value: 'title',
    label: 'Title'
  },
  {
    value: 'boolean',
    label: 'Checkbox'
  }
]

const EditPropertyView = ({
  onBack,
  value,
  onUpdateType
}: EditPropertyViewProps) => {


  return (
    <div>
      <div>
        <button className="flex justify-start" onClick={onBack}>
          <ArrowLeftIcon size={20} />
        </button>
      </div>
      <Select.Root value={[value]} items={columnTypeItems} onValueChange={(p) => {
        onUpdateType(p.value[0])
      }}>
        <Select.Label>Property Type</Select.Label>
        <Select.Control className="border border-slate-700 bg-secondary rounded-sm p-1">
          <Select.Trigger className="flex justify-between items-center w-full">
            <Select.ValueText />
            <Select.Indicator>
              <ChevronDownIcon />
            </Select.Indicator>
          </Select.Trigger>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content className="bg-secondary w-full text-secondary shadow-md">
                {columnTypeItems.map((item) => (
                  <Select.Item 
                    key={item.value} 
                    className="flex justify-between items-center w-[150px] p-2 hover:bg-slate-800 cursor-pointer" 
                    item={item}
                  >
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator>✓</Select.ItemIndicator>
                  </Select.Item>
                ))}

            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    </div>
  )
}


export const HeaderPopover = ({
  column,
  onUpdateSchema,
  dataSchema
}: HeaderPopoverProps) => {
  const [isEditProperty, setIsEditProperty] = useState<boolean>()

  const toggleEditProperty = () => {
    setIsEditProperty((bool) => !bool)
  }
  
  const onOpenChange = () => {
    setIsEditProperty(false)
  }

  const activeColumn = useMemo(() => {
    return dataSchema.schema.columns.find((col) => col.id === column.id)
  }, [column])

  const onUpdateColumnSchemaType = useCallback((type: string) => {
    onUpdateSchema((schema) => {
      schema.columns = schema.columns.map((schemaColumn) => {
        if (schemaColumn.id === column.id) {
          schemaColumn.type = type
        }
        return schemaColumn
      })
      return schema
    })
  }, [column.id])
  
  return (
    <Popover.Root onOpenChange={onOpenChange} positioning={{
      offset: {
        mainAxis: 0,
      },
      placement: 'bottom-start'
    }}>
      <Popover.Trigger asChild>
        <HeaderButton>
          <span>
            {columnTypeToIcon(column.type, {})}
          </span>
          <span>
            {column.name || '_'} 
          </span>
        </HeaderButton>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content className="bg-secondary w-[230px] p-3 shadow-md rounded-md font-normal text-sm z-[5000]">
          {isEditProperty ? <EditPropertyView onUpdateType={onUpdateColumnSchemaType} value={activeColumn!.type} onBack={toggleEditProperty}/> : (
            <div>
              <div className="border border-slate-700 bg-secondary rounded-sm p-1">
                <Input autoFocus defaultValue={column.name} onBlur={(e) => onUpdateSchema((schema) => {
      
                  schema.columns = schema.columns.map((schemaColumn) => {
                    if (schemaColumn.id === column.id) {
                      schemaColumn.name = e.target.value
                    }
                    return schemaColumn
                  })
                  return schema
                })} />
              </div>
              <div className="flex flex-col items-start mt-3 gap-1 mb-2">
                <button onClick={toggleEditProperty} className="flex gap-2 items-center">
                  <div>
                    <Pencil size={16} />
                  </div>
                  <div>
                    Edit Property
                  </div>
                </button>
              </div>
              <div className='pt-2 border-t border-slate-700'>
                <button className="flex gap-2 items-center" onClick={() => onUpdateSchema((schema) => {
                  schema.columns = schema.columns.filter((col) => col.id !== column.id)
                  return schema
                })}>
                  <div>
                    <Trash size={16} />
                  </div>
                  <div>
                    Delete
                  </div>
                </button>
              </div>
            </div>
          )}
          
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  )
}