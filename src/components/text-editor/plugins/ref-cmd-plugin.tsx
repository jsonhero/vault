import { Menu } from "@ark-ui/react";
import type { PluginViewSpec } from '@prosemirror-adapter/core';
import { usePluginViewContext, ReactPluginViewUserOptions } from "@prosemirror-adapter/react";
import { NodeSelection, Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { useRef, useState, useMemo, useEffect } from "react";
import { schema } from "../schema";
import { nanoid } from 'nanoid'
import { searchService } from "~/features/search";
import { useAppStateService, appStateService } from "~/features/app-state";
import { observer } from "mobx-react-lite";
import { useDbQuery } from "~/query-manager";
import { entityGraphService } from "~/services/entity-graph.service";

const RefPluginKey = new PluginKey('RefPlugin')

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

const RefComponent = () => {
  const { view } = usePluginViewContext()
  const ref = useRef<HTMLDivElement>(null)
  const isActiveRef = useRef<boolean>(false)

  const [coords, setCoords] = useState<Point | undefined>(undefined)
  const [isOpen, setOpen] = useState(false)

  const pluginState = useMemo(() => {
    return RefPluginKey.getState(view.state)
  }, [view.state])

  const query = useMemo(() => {
    if (pluginState) {
      return view.state.doc.textBetween(pluginState.pos + 1, view.state.selection.anchor)
    }
    return ''
  }, [pluginState?.pos, view.state.selection.anchor])

  const { data: results } = useDbQuery({
    keys: [query],
    query: (db) => db.selectFrom('entity')
      .where('title', 'like', query + '%')
      .selectAll(),
    enabled: query.length > 0
  })

  // const isActive = useMemo(() => coords !== undefined, [coords])

  useEffect(() => {
    if (pluginState?.mounted && !isActiveRef.current) {
      isActiveRef.current = true

      const coords = view.coordsAtPos(view.state.selection.anchor)

      setCoords({
        y: coords.top,
        x: coords.left,
      })
      setOpen(true)
      // temp hack till ark doesn't auto focus
      setTimeout(() => {
        view.focus()
      }, 100)
    } else if (isActiveRef.current && !pluginState?.mounted) {
      console.log('clearing')
      isActiveRef.current = false
      setCoords(undefined)
      setOpen(false)
    }
  }, [pluginState, view.state, ref.current])

  const onSelectReference = (e: React.MouseEvent<HTMLDivElement>) => {
    const entityId = parseInt(e.currentTarget.dataset.entityId || '', 10)
    if (appStateService.selectedEntityId) {
      entityGraphService.addEdge(appStateService.selectedEntityId, entityId, 'document_ref')
    }
  }

  // console.log(results, 'results')
  
  return (
    <Menu.Root open={isOpen} present={isOpen && coords !== undefined} anchorPoint={coords} positioning={{
      offset: {
        mainAxis: 20,
      },
      placement: 'bottom-start',
      strategy: 'absolute'
    }} closeOnSelect loop unmountOnExit={false} onFocusOutside={(event) => {
      event.preventDefault()
    }} onInteractOutside={(event) => event.preventDefault()}>
      <Menu.Positioner>
        <Menu.Content className="bg-white shadow-md">
          {results.map((item, i) => {
            const extraProps: any = {}

            // if (i === pluginState?.selectedMenuItemIndex) {
            //   extraProps['data-highlighted'] = true
            // }
            return (
              <Menu.Item key={i} onClick={onSelectReference} data-entity-id={item.id} className="text-black p-2 data-[highlighted]:text-red-500" {...extraProps}>{item.title}</Menu.Item>
            )
          })}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}


export function createRefPlugin(factory: (options: ReactPluginViewUserOptions) => PluginViewSpec) {
  const defaultState = { mounted: false, pos: undefined, selectedMenuItemIndex: 0 }
  const slashCmdPlugin = new Plugin({
    key: RefPluginKey,
    view: factory({
      component: RefComponent,
    }),

    state: {
      init() {
        return { ...defaultState }
      },
      apply(tr, value, oldState, newState) {
        const meta = tr.getMeta(RefPluginKey)
        if (meta !== undefined) return { ...value, ...tr.getMeta(RefPluginKey) };
        return value;
      },
    },
    props: {
      handleKeyDown(view, event) {
        const pluginState = this.getState(view.state)

        if (pluginState === undefined) {
          return false
        }

        if (event.key === '@') {
          if (!pluginState.mounted) {

            console.log('wtf mount?')
            const tr = view.state.tr.setMeta(RefPluginKey, {
              mounted: true,
              pos: view.state.selection.anchor,
            })
            view.dispatch(tr)
          }
        } else if (event.code === 'Space') {
          const tr = view.state.tr.setMeta(RefPluginKey, {
            mounted: false,
            pos: undefined,
          })
          view.dispatch(tr)
        } else if (event.code === 'Backspace') {
          if (pluginState.mounted && pluginState.pos === view.state.selection.anchor - 1) {
            const tr = view.state.tr.setMeta(RefPluginKey, {
              mounted: false,
              pos: undefined,
            })
            view.dispatch(tr)
          }
        } else if (pluginState.mounted && event.code === 'ArrowDown') {
          const tr = view.state.tr.setMeta(RefPluginKey, {
            selectedMenuItemIndex: (pluginState.selectedMenuItemIndex + 1) % menuItems.length
          })

          view.dispatch(tr)
          return true
        } else if (pluginState.mounted && event.code === 'ArrowUp') {
          const tr = view.state.tr.setMeta(RefPluginKey, {
            selectedMenuItemIndex: ((pluginState.selectedMenuItemIndex + menuItems.length) - 1) % menuItems.length
          })

          view.dispatch(tr)
          return true
        } else if (pluginState.mounted && event.code === 'Enter') {
          const tr = view.state.tr.setMeta(RefPluginKey, { ...defaultState })
          view.dispatch(tr)
        }

      },
    }
  })

  return slashCmdPlugin
}