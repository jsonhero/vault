import { Menu } from "@ark-ui/react";
import type { PluginViewSpec } from '@prosemirror-adapter/core';
import { usePluginViewContext, ReactPluginViewUserOptions } from "@prosemirror-adapter/react";
import { NodeSelection, Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { useRef, useState, useMemo, useEffect } from "react";
import { schema } from "../schema";
import { nanoid } from 'nanoid'
import { searchService } from "~/features/search";

const SlashPluginKey = new PluginKey('SlashPlugin')

interface Point {
  x: number;
  y: number;
}

const menuItems = [
  {
    id: 'table',
    name: 'Table'
  },
  {
    id: 'script',
    name: 'Script',
  }
]

const SlashComponent = () => {
  const { view } = usePluginViewContext()
  const ref = useRef<HTMLDivElement>(null)

  const [coords, setCoords] = useState<Point | undefined>(undefined)
  const [isOpen, setOpen] = useState(false)

  const pluginState = useMemo(() => {
    return SlashPluginKey.getState(view.state)
  }, [view.state])

  const isActive = useMemo(() => coords !== undefined, [coords])

  useEffect(() => {
    if (pluginState?.mounted && !isActive) {
      const coords = view.coordsAtPos(view.state.selection.head)

      setCoords({
        y: coords.top,
        x: coords.left,
      })
      setOpen(true)
      // temp hack till ark doesn't auto focus
      setTimeout(() => {
        view.focus()
      }, 100)
    } else if (isActive && !pluginState?.mounted) {
      setCoords(undefined)
      setOpen(false)
    }
  }, [pluginState, view.state, ref.current, isActive])
  
  return (
    <Menu.Root open={isOpen} present={isOpen && coords !== undefined} anchorPoint={coords} positioning={{
      offset: {
        mainAxis: 28,
      },
      placement: 'top-start',
      strategy: 'absolute'
    }} closeOnSelect loop unmountOnExit={false} onFocusOutside={(event) => {
      event.preventDefault()
    }} onInteractOutside={(event) => event.preventDefault()}>
      <Menu.Positioner>
        <Menu.Content className="bg-white shadow-md">
          {menuItems.map((item, i) => {
            const extraProps: any = {}

            if (i === pluginState?.selectedMenuItemIndex) {
              extraProps['data-highlighted'] = true
            }
            return (
              <Menu.Item key={i} className="text-black p-2 data-[highlighted]:text-red-500" {...extraProps}>{item.name}</Menu.Item>
            )
          })}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}


export function createSlashPlugin(factory: (options: ReactPluginViewUserOptions) => PluginViewSpec) {
  const defaultState = { mounted: false, pos: undefined, selectedMenuItemIndex: 0 }
  const slashCmdPlugin = new Plugin({
    key: SlashPluginKey,
    view: factory({
      component: SlashComponent,
    }),

    state: {
      init() {
        return { ...defaultState }
      },
      apply(tr, value, oldState, newState) {
        const meta = tr.getMeta(SlashPluginKey)
        if (meta !== undefined) return { ...value, ...tr.getMeta(SlashPluginKey) };
        return value;
      },
    },
    props: {
      handleKeyDown(view, event) {
        const pluginState = this.getState(view.state)

        if (pluginState === undefined) {
          return false
        }

        if (event.code === 'Slash') {
          if (!pluginState.mounted) {
            const tr = view.state.tr.setMeta(SlashPluginKey, {
              mounted: true,
              pos: view.state.selection.anchor,
            })
            view.dispatch(tr)
          }
        } else if (event.code === 'Space') {
          const tr = view.state.tr.setMeta(SlashPluginKey, {
            mounted: false,
            pos: undefined,
          })
          view.dispatch(tr)
        } else if (event.code === 'Backspace') {
          if (pluginState.mounted && pluginState.pos === view.state.selection.anchor - 1) {
            const tr = view.state.tr.setMeta(SlashPluginKey, {
              mounted: false,
              pos: undefined,
            })
            view.dispatch(tr)
          }
        } else if (pluginState.mounted && event.code === 'ArrowDown') {
          const tr = view.state.tr.setMeta(SlashPluginKey, {
            selectedMenuItemIndex: (pluginState.selectedMenuItemIndex + 1) % menuItems.length
          })

          view.dispatch(tr)
          return true
        } else if (pluginState.mounted && event.code === 'ArrowUp') {
          const tr = view.state.tr.setMeta(SlashPluginKey, {
            selectedMenuItemIndex: ((pluginState.selectedMenuItemIndex + menuItems.length) - 1) % menuItems.length
          })

          view.dispatch(tr)
          return true
        } else if (pluginState.mounted && event.code === 'Enter') {

          // need some sort of relay system of keyboard input to the component, so react context and stores can be used 
          // or use solid lul

          const item = menuItems[pluginState.selectedMenuItemIndex]
          
          if (item.id === 'table') {
            const tr = view.state.tr.setMeta(SlashPluginKey, { ...defaultState })

            
            view.dispatch(tr)

            setTimeout(() => {
              searchService.open({
                entityTypeFilter: 'table',
                onClickResult(entityId) {

                  const {$from, to} = view.state.selection
                  const same = $from.sharedDepth(to)
                  if (same == 0) return false
                  const pos = $from.before(same)
                  const parentNode = NodeSelection.create(view.state.doc, pos)
                  tr.setSelection(parentNode)
                  
                  const tableblock = schema.nodes.tableblock.create({
                    entityId,
                  })

                  tr.replaceSelectionWith(tableblock)

                  view.dispatch(tr)
                  // view.state.
                  // how to access current view state...
                  // console.log(entityId, 'omg!')
                },
              })
            }, 150)

            return true
          } else if (item.id === 'script') {
            const tr = view.state.tr.setMeta(SlashPluginKey, { ...defaultState })
            const {$from, to} = view.state.selection
            const same = $from.sharedDepth(to)
            if (same == 0) return false
            const pos = $from.before(same)
            const parentNode = NodeSelection.create(view.state.doc, pos)
            tr.setSelection(parentNode)

            const scriptId = nanoid()
            const codemirrorblock = schema.nodes.codemirror.create({
              scriptId
            })
            const scriptblock = schema.nodes.scriptblock.create({
              id: scriptId
            }, codemirrorblock)

            tr.replaceSelectionWith(scriptblock)
            // console.log(parentNode, 'node')
            // goto inside of new code block
            tr.setSelection(TextSelection.create(tr.doc, pos + 2))
            view.dispatch(tr)
            return true
          }

        }
      },
    }
  })

  return slashCmdPlugin
}