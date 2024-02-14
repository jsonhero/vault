import { Node as ProsemirrorNode, NodeSpec, NodeType, Schema } from "prosemirror-model";
import { Editor } from "./editor";
import { Decoration, DecorationSource, EditorView, NodeView } from "prosemirror-view";
import { InputRule } from "prosemirror-inputrules";
import { Command } from "prosemirror-state";

interface NodeViewProps {
  node: ProsemirrorNode
  view: EditorView
  getPos: () => number | undefined
  decorations: readonly Decoration[]
  innerDecorations: DecorationSource
}

interface NodeConfig {
  name: string
  spec(): NodeSpec
  nodeView?(
    this: {
      editor: Editor
    },
    props: NodeViewProps
  ): NodeView
  inputRules?: (options: { type: NodeType, schema: Schema }) => InputRule[]
  keymap?: (options: { type: NodeType, schema: Schema }) => Record<string, Command>
}

export class Node {
  name: string
  config;

  constructor(config: NodeConfig) {
    this.name = config.name
    this.config = config
  }

  static create(config: NodeConfig) {
    return new Node(config)
  }
}
