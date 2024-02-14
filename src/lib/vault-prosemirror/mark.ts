import { InputRule } from "prosemirror-inputrules";
import { MarkSpec, MarkType, Schema } from "prosemirror-model";
import { Command } from "prosemirror-state";

interface MarkConfig {
  name: string
  spec(): MarkSpec
  keymap?: (options: { type: MarkType, schema: Schema }) => Record<string, Command>
  inputRules?: (options: { type: MarkType, schema: Schema }) => InputRule[]
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