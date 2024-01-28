import { Menu } from "@ark-ui/react";
import { InputRule, inputRules, undoInputRule } from "prosemirror-inputrules";

import { EditorState, Plugin, PluginKey, Selection, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import { ProseMirrorReactPlugin } from '~/lib/prosemirror-react'
import { ReactRenderer } from '~/lib/prosemirror-react/react-renderer'

const suggestionKey = new PluginKey('suggestion')

export function inDecoration(selection: Selection, decorations: DecorationSet) {
  return decorations.find(selection.from, selection.to).length > 0;
}

export function openSuggestion(state: EditorState, tr: Transaction, trigger: string, range: any, dispatch?: (trx: Transaction) => void) {
  const plugin = suggestionKey.get(state) as Plugin;
  const meta = { action: 'add', trigger, range };
  const _tr = tr.setMeta(plugin, meta);
  if (dispatch) {
    dispatch(_tr);
  }
  return _tr
}

export function closeSuggestion(view: EditorView) {
  const plugin = suggestionKey.get(view.state) as Plugin;
  const meta = { action: 'remove' };
  const tr = view.state.tr.setMeta(plugin, meta);
  view.dispatch(tr);
  return true;
}

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
const SuggestionComponent = forwardRef(({ view, active, ...rest }: { view: EditorView, active: boolean }, ref) => {
  const [coords, setCoords] = useState<Point | undefined>(undefined)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const isMounted = useMemo(() => coords !== undefined, [coords])

  useEffect(() => {
    if (active && !isMounted) {
      const c = view.coordsAtPos(view.state.selection.head)

      setCoords({
        y: c.top,
        x: c.left,
      })
      // temp hack till ark doesn't auto focus, this is stupid af, blocks input
      setTimeout(() => {
        view.focus()
      }, 100)

    } else if (!active && isMounted) {
      setCoords(undefined)
    }

  }, [active, view.state])

  const upHandler = () => {
    setSelectedIndex((selectedIndex + menuItems.length - 1) % menuItems.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % menuItems.length)
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      return false
    }
  }))

  return (
    <Menu.Root open={isMounted} present={isMounted && coords !== undefined} anchorPoint={coords} positioning={{
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

            if (i === selectedIndex) {
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
})

type Trigger = {
  trigger: string | RegExp
}

export function createInputRule(plugin: Plugin, type: Trigger) {
  const trigger =
    typeof type.trigger === 'string'
      ? RegExp(`(?:^|\\s|\\n|[^\\d\\w])(${type.trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})$`)
      : type.trigger;

  return new InputRule(trigger, (state, match) => {
    const { decorations } = plugin.getState(state);
    // If we are currently suggesting, don't activate
    if (inDecoration(state.selection, decorations)) return null;
    // We are taking over the text input here
    const tr = state.tr.insertText(match[1][match[1].length - 1]).scrollIntoView();
    const meta = { action: 'add', trigger: match[1] };
    tr.setMeta(plugin, meta);
    return tr;
  });
}

type SuggestionState = {
  active: boolean
  query?: string
  trigger?: string
  decorations: DecorationSet
  range?: {
    from: number,
    to: number,
  }
}



const inactiveSuggestionState: SuggestionState = {
  active: false,
  decorations: DecorationSet.empty,
};


export const suggestionPlugin = ProseMirrorReactPlugin.create({
  name: 'suggestion',
  buildPlugin(editor) {

    let component: ReactRenderer | null;

    const plugin = new Plugin<SuggestionState>({
      key: suggestionKey,
      view(view) {

        component = new ReactRenderer(SuggestionComponent, {
          editor,
          as: document.body,
          props: {
            view,
            query: '',
            active: false,
          }
        })

        return {
          update(view, prevState) {
            setTimeout(() => {
              component?.updateProps({ view })
            })
          },
          destroy() {
            component?.destroy()
          },
        }
      },
      state: {
        init: () => inactiveSuggestionState,
        apply(tr, state) {
          const meta = tr.getMeta(plugin)

          if (meta?.action === 'add' && !state.active) {
            const { trigger, range } = meta

            // include range from params?
            const from = range?.from ?? tr.selection.from - trigger.length;
            const to = range?.to ?? tr.selection.from;

            const deco = Decoration.inline(from, to, {
              class: 'autocomplete',
            }, {
              inclusiveStart: false,
              inclusiveEnd: true,
            })

            const query = tr.doc.textBetween(from, to).slice(trigger?.length)

            component?.updateProps({
              active: true,
              query,
            })

            return {
              active: true,
              query,
              trigger,
              decorations: DecorationSet.create(tr.doc, [deco]),
              range: {
                from,
                to,
               }
            }
          }


          const { decorations } = state
          const nextDecorations = decorations.map(tr.mapping, tr.doc);
          const hasDecoration = nextDecorations.find().length > 0;

          if (
            meta?.action === 'remove' ||
            !inDecoration(tr.selection, nextDecorations) ||
            !hasDecoration
          ) {
            component?.updateProps({
              active: false,
              query: '',
            })
            return inactiveSuggestionState
          }

          const { trigger } = state 

          // Ensure that the trigger is in the decoration
          const { from, to } = nextDecorations.find()[0];
          const text = tr.doc.textBetween(from, to);
          if (trigger && !text.startsWith(trigger)) return inactiveSuggestionState

          const nextState = {
            ...state,
            decorations: nextDecorations,
            range: { from, to },
            query: text.slice(trigger?.length),
          }

          component?.updateProps({
            active: nextState.active,
            query: nextState.query,
          })

          return nextState
        }
      },
      props: {
        decorations: (state) => plugin.getState(state)?.decorations,
        handleKeyDown(view, event) {
          const { active, decorations } = plugin.getState(view.state)

          if (!active || !inDecoration(view.state.selection, decorations)) return false;

          const { from, to } = decorations.find()[0];
          const text = view.state.doc.textBetween(from, to);


          // close if space after
          if (text.length && event.key === ' ' || event.key === 'Spacebar') {
            closeSuggestion(view)
            // Take over the space creation so no other input rules are fired
            // view.dispatch(view.state.tr.insertText(' ').scrollIntoView())
            return false
          }

          if (text.length === 0 && event.key === 'Backspace') {
            undoInputRule(view.state, view.dispatch)
            closeSuggestion(view)
            return true
          }

          if (event.key === 'Escape') {
            closeSuggestion(view)
            return true
          }

          return component?.ref.onKeyDown({ event })
        }
      }
    })

    return [
      plugin, 
      // inputRules({ 
      //   rules: [createInputRule(plugin, {
      //     trigger: '#'
      //   })]
      // })
    ]
  },
})