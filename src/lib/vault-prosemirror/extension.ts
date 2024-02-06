import { Plugin as ProseMirrorPlugin } from 'prosemirror-state'

import { Editor } from './editor'
import { Mark } from './mark'
import { Node } from './node'

interface ExtensionConfig<Options> {

  name: string;

  proseMirrorPlugins(
    this: {
      editor: Editor,
      options: Options
    }
  ): ProseMirrorPlugin[]

  extensions(
    this: {
      options: Options
    }
  ): Extension[]

  defaultOptions: () => Options

  marks(): Mark[]

  nodes(): Node[]

  // addVault
}

export class Extension<Options = any> {
  config;
  options: Options


  
  constructor(config: Partial<ExtensionConfig<Options>>) {
    this.config = config

    this.options = {}

    if (config.defaultOptions) {
      this.options = config.defaultOptions()
    }


  }

  static create<Options>(config: Partial<ExtensionConfig<Options>>) {
    return new Extension(config)
  }

  configure(options: Partial<Options> = {}) {
    const plugin = new Extension(this.config)

    plugin.options = { ...plugin.options, ...options }

    return plugin
  }
}
