import { Decoration, DecorationSource, EditorView, NodeViewConstructor } from "prosemirror-view";
import { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import { Command, EditorState, Transaction } from 'prosemirror-state'
import { nanoid } from 'nanoid'

import { Extension } from './extension'
import type { ReactRenderer } from "./react/react-renderer";
import { Mark } from "./mark";
import { Node } from "./node";
import { flattenExtensions, getSchema } from "./helpers";
import { keymap } from "prosemirror-keymap";
import { inputRules } from "prosemirror-inputrules";

export interface EditorOptions {
  doc: string | ProseMirrorNode
  extensions: Extension[]
  nodes: Node[],
  marks: Mark[]
  onTransaction: (props: {
    transaction: Transaction,
    editor: Editor,
  }) => void
  onUpdate: (props: {
    state: EditorState,
    editor: Editor
  }) => void
}

interface EditorRenderer {
  setRenderer: (id: string, renderer: ReactRenderer) => void
  removeRenderer: (id: string) => void
}

export class Editor {
  id: string;
  public view!: EditorView
  editorElement?: HTMLDivElement
  renderer?: EditorRenderer

  public options: EditorOptions = {
    doc: '',
    extensions: [],
    nodes: [],
    marks: [],
    onTransaction: () => null,
    onUpdate: () => null,
  }

  constructor(options: Partial<EditorOptions>) {
    this.id = nanoid(6)
    this.setOptions(options)
  }


  setRenderer(renderer: EditorRenderer) {
    this.renderer = renderer
  }

  setOptions(options: Partial<EditorOptions>) {
    this.options = {
      ...this.options,
      ...options,
    }

    if (this.view && !this.view.isDestroyed && this.options.doc) {
      const newState = this.createState()
      setTimeout(() => {
        this.view.updateState(newState)
      })
    }

  }

  mount(element: HTMLDivElement) {
    if (!this.view) {
      this.editorElement = element
      this.createView()
    }
  }

  buildPlugins(schema: Schema) {
    const flattenedExtensions = flattenExtensions(this.options.extensions);

    const proseMirrorPlugins = flattenedExtensions.flatMap((ext) => {
      if (ext.config.proseMirrorPlugins) {
        const pmPlugins = ext.config.proseMirrorPlugins?.call({
          editor: this,
          options: ext.options,
        });

        if (pmPlugins) {
          return pmPlugins;
        }
      }
      return [];
    });

    const nodeInputRules = this.options.nodes.flatMap((node) => {
      return node.config.inputRules?.({
        schema,
        type: schema.nodes[node.config.name],
      }) || []
    })

    const nodeKeymapRecord: Record<string, Command> = this.options.nodes.reduce(
      (keymap, node) => {
        return {
          ...keymap,
          ...node.config.keymap?.({
            schema,
            type: schema.nodes[node.config.name],
          }),
        };
      },
      {}
    );

    const markInputRules = this.options.marks.flatMap((mark) => {
      return (
        mark.config.inputRules?.({
          schema,
          type: schema.marks[mark.config.name],
        }) || []
      );
    });

    const markKeymapRecord: Record<string, Command> = this.options.marks.reduce(
      (keymap, mark) => {
        return {
          ...keymap,
          ...mark.config.keymap?.({
            schema,
            type: schema.marks[mark.config.name],
          }),
        };
      },
      {}
    );

    const markPlugins = this.options.marks.flatMap((mark) => {
      if (mark.config.proseMirrorPlugins) {
        const pmPlugins = mark.config.proseMirrorPlugins?.call({
          editor: this,
          // options: mark.options,
        }, {
          schema,
          type: schema.marks[mark.config.name],
        });

        if (pmPlugins) {
          return pmPlugins;
        }
      }
      return [];
    })

    console.log(nodeKeymapRecord, 'record')

    return [
      keymap({ ...markKeymapRecord, ...nodeKeymapRecord }),
      inputRules({ rules: [...markInputRules, ...nodeInputRules] }),
      ...markPlugins,
      ...proseMirrorPlugins,
    ];
  }


  buildNodeViews() {
    const flattenedExtensions = flattenExtensions(this.options.extensions)
    const extensionNodes = flattenedExtensions.flatMap((ext) => {
      if (ext.config.nodes) {
        return ext.config.nodes()
      }
      return []
    })

    const nodes = [...this.options.nodes, ...extensionNodes]

    const nodeViews: { [key: string]: NodeViewConstructor } = {}
    
    nodes.forEach((node) => {
      if (node.config.nodeView) {
        nodeViews[node.config.name] = (
          pmNode: ProseMirrorNode,
          view: EditorView,
          getPos: () => number | undefined,
          decorations: readonly Decoration[],
          innerDecorations: DecorationSource
        ) => node.config.nodeView!.call({ editor: this }, {
          node: pmNode,
          view,
          getPos,
          decorations,
          innerDecorations
        })
      }
    })

    return nodeViews
  }

  dispatchTransaction(transaction: Transaction) {  
    if (this.view.isDestroyed) {
      return
    }

    if (this.options.onTransaction) {
      this.options.onTransaction({
        editor: this,
        transaction,
      })
    }
    const state = this.view.state.apply(transaction);

    this.view.updateState(state)
    
    this.options.onUpdate({
      editor: this,
      state,
    })

  }

  createState() {
    const schema = getSchema({
      extensions: this.options.extensions,
      marks: this.options.marks,
      nodes: this.options.nodes,
    })

    const proseMirrorPlugins = this.buildPlugins(schema)
    let state: EditorState

    if (this.options.doc instanceof ProseMirrorNode) {
      state = EditorState.create({
        doc: this.options.doc,
        plugins: proseMirrorPlugins,
        schema,
      })
    } else {
      state = EditorState.fromJSON({
        schema,
        plugins: proseMirrorPlugins,
      }, this.options.doc)
    }

    return state
  }
 
  createView() {
    const state = this.createState()
    const nodeViews = this.buildNodeViews()

    this.view = new EditorView(this.editorElement!, {
      state,
      dispatchTransaction: this.dispatchTransaction.bind(this),
      // attributes: {
      //   id: this.id
      // },
      nodeViews,
    })
  }

  destroy = () => {
    this.view?.destroy()
  }

}