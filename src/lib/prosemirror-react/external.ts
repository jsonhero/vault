import { Decoration, DecorationSource, EditorView } from "prosemirror-view";
import { Node as ProseMirrorNode } from 'prosemirror-model'
import { Component } from 'react'

import { ReactNodeView, NodeViewDOMSpec } from './node-view/react-node-view'
import { EditorContent } from './react-renderer'
import { Plugin as ProseMirrorPlugin } from "prosemirror-state";


type ProseMirrorReactNodeProps = {
  name: string;
  component: React.FunctionComponent;
  as?: NodeViewDOMSpec
  contentAs?: NodeViewDOMSpec
}

export class ProseMirrorReactNode {
  props: ProseMirrorReactNodeProps
  constructor(props: ProseMirrorReactNodeProps) {
    this.props = props
  }

  static create(props: ProseMirrorReactNodeProps) {
    return new ProseMirrorReactNode(props)
  }
}

type ProseMirrorReactPluginProps = {
  name: string;
  buildPlugin: (editor: EditorContent) => ProseMirrorPlugin
}

export class ProseMirrorReactPlugin {
  props;
  constructor(props: ProseMirrorReactPluginProps) {
    this.props = props;
  }

  static create(props: ProseMirrorReactPluginProps) {
    return new ProseMirrorReactPlugin(props)
  }
}


export function buildReactNodes(editor: EditorContent) {
  return (nodes: ProseMirrorReactNode[]) => {
    return nodes.reduce((nodeMap: any, reactNode) => {
      nodeMap[reactNode.props.name] = (
        node: ProseMirrorNode,
        view: EditorView,
        getPos: () => number | undefined,
        decorations: readonly Decoration[],
        innerDecorations: DecorationSource,
      ) => {
        return new ReactNodeView({
          node,
          view,
          getPos,
          decorations,
          innerDecorations,
          editor,
          component: reactNode.props.component
        }, {
          as: reactNode.props.as,
          contentAs: reactNode.props.contentAs
        })
      }
  
      return nodeMap
    }, {})
  }

}

export function buildReactPlugins(editor: EditorContent) {
  return (plugins: ProseMirrorReactPlugin[]) => {
    return plugins.map((plugin) => plugin.props.buildPlugin(editor))
  }
}
