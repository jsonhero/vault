import { Decoration, DecorationSource, EditorView } from "prosemirror-view";
import { Node as ProseMirrorNode, Attrs as PMAttrs } from 'prosemirror-model'
import { createContext, useContext } from "react";

export type NodeViewContentRef = (node: HTMLElement | null) => void

export interface NodeViewContextProps {
  // don't change
  contentRef: NodeViewContentRef
  view: EditorView;
  getPos: () => number | undefined;
  setAttrs: (attrs: PMAttrs) => void

  // can change
  selected: boolean;
  node: ProseMirrorNode;
  decorations?: readonly Decoration[]
  innerDecorations?: DecorationSource
}

export const NodeViewContext = createContext<NodeViewContextProps>(null);
export const useNodeView = () => useContext(NodeViewContext)!;