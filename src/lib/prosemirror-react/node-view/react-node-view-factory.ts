import { Decoration, DecorationSource, EditorView } from "prosemirror-view";
import { Node as ProseMirrorNode } from 'prosemirror-model'
import { Component } from 'react'

import { ReactNodeView, NodeViewDOMSpec } from './react-node-view'
import { EditorContent } from '../react-renderer'

interface ReactNodeViewFactoryProps {
  // DOM
  as?: NodeViewDOMSpec
  contentAs?: NodeViewDOMSpec

  // Component
  component: Component
}
export function reactNodeViewFactory(props: ReactNodeViewFactoryProps, ProvidedReactNodeView: typeof ReactNodeView = ReactNodeView) {
  return (
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
    decorations: readonly Decoration[],
    innerDecorations: DecorationSource,
    editor: EditorContent,
  ) => {
    return new ProvidedReactNodeView({
      node,
      view,
      getPos,
      decorations,
      innerDecorations,
      editor,
      component: props.component
    }, {
      as: props.as,
      contentAs: props.contentAs
    })
  }
}