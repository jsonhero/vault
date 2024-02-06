import { MarkSpec } from "prosemirror-model";

interface MarkConfig {
  name: string
  spec(): MarkSpec
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