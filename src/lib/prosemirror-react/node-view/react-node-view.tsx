import 'prosemirror-view/style/prosemirror.css'
import { Component } from 'react'
import { Decoration, DecorationSource, EditorView, NodeView } from "prosemirror-view";
import { Node as ProseMirrorNode, Attrs as ProseMirrorAttrs } from 'prosemirror-model'

import { EditorContent, ReactRenderer } from '../react-renderer'
import { NodeViewContextProps, NodeViewContext } from './react-node-view-context'

export interface ReactNodeViewOptions {
  // DOM
  as?: NodeViewDOMSpec
  contentAs?: NodeViewDOMSpec
  manualMount?: boolean;
  disableContent?: boolean;
}

export interface ReactNodeViewProps {
  editor: EditorContent;
  node: ProseMirrorNode;
  view: EditorView;
  getPos: () => number | undefined;
  component: Component;
  decorations?: readonly Decoration[]
  innerDecorations?: DecorationSource
}

export type NodeViewDOMSpec = string | HTMLElement | ((node: ProseMirrorNode) => HTMLElement)

export class ReactNodeView implements NodeView {
  node: ProseMirrorNode;
  view: EditorView;
  getPos: () => number | undefined;
  component: Component
  domElement: HTMLElement
  contentDOMElement: HTMLElement | null

  decorations?: readonly Decoration[]
  innerDecorations?: DecorationSource
  selected = false;
  
  editor: EditorContent
  renderer!: ReactRenderer
  childContent: HTMLElement | null = null
  
  constructor({ 
    node,
    view,
    getPos,
    component,
    decorations,
    innerDecorations,
    editor,
  }: ReactNodeViewProps, options?: ReactNodeViewOptions) {
    // Store for later
    this.node = node
    this.view = view
    this.getPos = getPos
    this.component = component
    this.decorations = decorations
    this.innerDecorations = innerDecorations
    this.editor = editor

    // dom setup
    this.domElement = this.createDOM(options?.as)
    this.contentDOMElement = options?.disableContent || node.isLeaf ? null : this.createContentDOM(options?.contentAs)

    // this.dom.setAttribute('data-node-view-root', 'true')
    if (this.contentDOMElement) {
      this.contentDOMElement.setAttribute('data-node-view-content', 'true')
      this.contentDOMElement.style.whiteSpace = 'break-spaces'
      this.childContent = this.contentDOMElement
    }

    // if (!options?.manualMount) {
      this.mount()
    // }
  }

  get dom() {
    return this.renderer.element as HTMLElement
  }

  get contentDOM() {
    return this.contentDOMElement
  }

  mount() {
    const props: NodeViewContextProps = {
      contentRef: (element) => {
        if (element && this.contentDOM && element.firstChild !== this.contentDOM)
          element.appendChild(this.contentDOM)
      },
      view: this.view,
      getPos: this.getPos,
      setAttrs: this.setAttrs,
      node: this.node,
      selected: this.selected,
      decorations: this.decorations,
      innerDecorations: this.innerDecorations,
    }

    const ReactNodeViewProvider: React.FunctionComponent<NodeViewContextProps> = (providerProps) => {
      const Component = this.component

      return (
        <>
          <NodeViewContext.Provider value={providerProps}>
            {/* @ts-ignore */}
            <Component />
          </NodeViewContext.Provider>
        </>
      )
    }
    ReactNodeViewProvider.displayName = 'ReactNodeView'

    this.renderer = new ReactRenderer(ReactNodeViewProvider, {
      editor: this.editor,
      props,
      className: 'react-node-view',
      as: this.domElement,
    })
  }

  #createElement(as?: string | HTMLElement | ((node: ProseMirrorNode) => HTMLElement)) {
    const { node } = this
    return as == null
      ? document.createElement(node.isInline ? 'span' : 'div')
      : as instanceof HTMLElement
        ? as
        : as instanceof Function
          ? as(node)
          : document.createElement(as)
  }

  createDOM(as?: string | HTMLElement | ((node: ProseMirrorNode) => HTMLElement)) {
    return this.#createElement(as)
  }

  createContentDOM(as?: string | HTMLElement | ((node: ProseMirrorNode) => HTMLElement)) {
    return this.#createElement(as)
  }

  setAttrs = (attr: ProseMirrorAttrs) => {
    const { dispatch, state } = this.view
    const pos = this.getPos()

    if (typeof pos !== 'number')
      return

    return dispatch(
      state.tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        ...attr,
      }),
    )
  }

  update(node: ProseMirrorNode, decorations: readonly Decoration[]) {
    if (node.type !== this.node.type) {
      return false;
    }

    if (node === this.node && this.decorations === decorations) {
      return true;
    }
    

    this.node = node;
    this.decorations = decorations;

    this.renderer.updateProps({ node, decorations });

    return true;
  }

  selectNode() {
    this.renderer.updateProps({
      selected: true,
    });
  }

  deselectNode() {
    this.renderer.updateProps({
      selected: false,
    });
  }

  ignoreMutation() {
    console.log('mutation')
    return true
  }

  destroy() {
    this.renderer.destroy()
  }
}
