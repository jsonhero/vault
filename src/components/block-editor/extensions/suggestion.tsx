import { Menu, Tooltip } from "@ark-ui/react";
import { sql } from "kysely";
import { InputRule, inputRules, undoInputRule } from "prosemirror-inputrules";

import { EditorState, Plugin, PluginKey, Selection, TextSelection, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import { useDbQuery } from "~/query-manager";

import { Extension } from "~/lib/vault-prosemirror";
import { ReactRenderer } from "~/lib/vault-prosemirror/react";

export function inDecoration(selection: Selection, decorations: DecorationSet) {
  return decorations.find(selection.from, selection.to).length > 0;
}

export function openSuggestion(key: PluginKey, state: EditorState, tr: Transaction, trigger: string, range: any, dispatch?: (trx: Transaction) => void) {
  const plugin = key.get(state) as Plugin;
  const meta = { action: 'add', trigger, range };
  const _tr = tr.setMeta(plugin, meta);
  if (dispatch) {
    dispatch(_tr);
  }
  return _tr
}

export function closeSuggestion(key: PluginKey, view: EditorView, removeQuery?: boolean) {
  const plugin = key.get(view.state) as Plugin;
  const meta = { action: 'remove' };
  let tr = view.state.tr.setMeta(plugin, meta);
  if (removeQuery) {
    const { range } = key.getState(view.state)
    tr = view.state.tr.deleteRange(range.from, range.to)
  }
  view.dispatch(tr);
  return true;
}

interface Point {
  x: number;
  y: number;
}

export const SuggestionPopover = forwardRef(({ children, active, upHandler, downHandler, enterHandler, hasData }: { view: EditorView, active: boolean }, ref) => {
  const [coords, setCoords] = useState<Point | undefined>(undefined)  
  const isMounted = useMemo(() => coords !== undefined, [coords])

  useEffect(() => {
    if (active && !isMounted) {
      setTimeout(() => {
        const element = document.querySelector('.suggestion-query')
        const c = element!.getBoundingClientRect()

        setCoords({
          y: c.top + c.height,
          x: c.left,
        })
      })

    } else if (!active && isMounted) {
      setCoords(undefined)
    }

  }, [active, isMounted])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return hasData
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return hasData
      }

      if (event.key === 'Enter') {
        if (!hasData) return false
        enterHandler()
        return true
      }

      return false
    }
  }))

  return (
    <Tooltip.Root  open={isMounted} present={isMounted && coords !== undefined} positioning={{
      offset: {
        mainAxis: 4,
      },
      getAnchorRect() {
        return {
          x: coords?.x,
          y: coords?.y
        }
      },
      placement: 'bottom-start',
      strategy: 'absolute',
    }} unmountOnExit={false}>
      <Tooltip.Positioner style={{
        zIndex: 3000
      }}>
        <Tooltip.Content className="bg-gray-800 shadow-md">
          {children}
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
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

interface SuggestionExtensionOptions {
  key: PluginKey
  component: any
}

export const SuggestionExtension = Extension.create<SuggestionExtensionOptions>({
  name: 'suggestion-ext',
  proseMirrorPlugins() {
    const editor = this.editor
    const options = this.options
    const suggestionKey = options.key

    let renderer: ReactRenderer | null;
  
    const plugin: Plugin = new Plugin<SuggestionState>({
      key: suggestionKey,
      view(view) {
  
        renderer = new ReactRenderer(options.component, {
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
              renderer?.updateProps({ view })
            })
          },
          destroy() {
            setTimeout(() => {
              renderer?.destroy()
            })
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
              class: 'suggestion-query',
            }, {
              inclusiveStart: false,
              inclusiveEnd: true,
            })
  
            const query = tr.doc.textBetween(from, to).slice(trigger?.length)
  
            console.log('opening!', query, range, from, to, deco)
            
            renderer?.updateProps({
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
            console.log('closing!')
            renderer?.updateProps({
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
  
          renderer?.updateProps({
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
            closeSuggestion(suggestionKey, view)
            // Take over the space creation so no other input rules are fired
            // view.dispatch(view.state.tr.insertText(' ').scrollIntoView())
            return false
          }
  
          if (text.length === 0 && event.key === 'Backspace') {
            undoInputRule(view.state, view.dispatch)
            closeSuggestion(suggestionKey, view)
            return true
          }
  
          if (event.key === 'Escape') {
            closeSuggestion(suggestionKey, view)
            return true
          }
  
          return renderer?.ref.onKeyDown({ event })
        }
      }
    })

    return [plugin]
  },
})