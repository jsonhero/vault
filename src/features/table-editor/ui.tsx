import { Menu } from '@ark-ui/react'
import { GripVerticalIcon } from 'lucide-react'
import { ComponentProps, forwardRef, useState } from 'react'

import { twMerge } from 'tailwind-merge'
import { Button } from '~/components/ui/button'
import { entityService } from '~/services/entity.service'

interface HeaderButtonProps extends ComponentProps<'button'> {
  children?: React.ReactNode
}

export const HeaderButton = ({ className, ...rest }: HeaderButtonProps) => {
  const _className = twMerge('flex items-center p-[6px] gap-2 min-w-[24px] w-full text-left rounded-none font-normal', className)
  return (
    <Button className={_className} {...rest} />
  )
}

export const CellInput = forwardRef<HTMLInputElement, ComponentProps<'input'>>((props, ref) => {
  const className = twMerge('focus:bg-zinc-700 p-1 bg-transparent w-full focus-visible:outline-none focus-visible:border-none outline-none border-none', props.className);

  return (
    <input
      {...props}
      ref={ref}
      className={className}
    />
  );
});

export const RowHoverControl = ({ entityId }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="group-hover:block hidden data-[active=true]:block" data-active={open}>
      <Menu.Root lazyMount onOpenChange={(details) => setOpen(details.open) }>
        <Menu.Trigger>
          <Button>
            <GripVerticalIcon />
          </Button>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content className="bg-primary p-3 shadow-md rounded-md z-50">
            <Menu.Item id="delete" onClick={() => entityService.deleteById(entityId)}>Delete</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
    </div>
  )
}