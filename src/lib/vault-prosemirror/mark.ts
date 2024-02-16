import { InputRule } from "prosemirror-inputrules";
import { MarkSpec, MarkType, Schema } from "prosemirror-model";
import { Command } from "prosemirror-state";
import { Plugin as ProseMirrorPlugin } from 'prosemirror-state'

import { Editor } from './editor'

interface MarkConfig {
  name: string
  spec(): MarkSpec
  keymap?: (options: { type: MarkType, schema: Schema }) => Record<string, Command>
  inputRules?: (options: { type: MarkType, schema: Schema }) => InputRule[]
  proseMirrorPlugins?(
    this: {
      editor: Editor,
    },
    options: { type: MarkType, schema: Schema }
  ): ProseMirrorPlugin[]
}

export class Mark {
  config;

  constructor(config: MarkConfig) {
    this.config = config
  }

  static create(config: MarkConfig) {
    return new Mark(config)
  }
}