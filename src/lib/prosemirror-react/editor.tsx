import React, {
  ForwardedRef, forwardRef, HTMLProps, LegacyRef, MutableRefObject,
} from 'react'
import ReactDOM, { flushSync } from 'react-dom'

import type { EditorContent, ReactRenderer } from './react-renderer'
import { buildReactNodes, buildReactPlugins } from './external'

const Portals: React.FC<{ renderers: Record<string, ReactRenderer> }> = ({ renderers }) => {
  return (
    <>
      {Object.entries(renderers).map(([key, renderer]) => {
        return ReactDOM.createPortal(renderer.reactElement, renderer.element, key)
      })}
    </>
  )
}

export interface EditorState {
  renderers: Record<string, any>;
}

export type EditorFactoryProps = {
  buildReactNodes: ReturnType<typeof buildReactNodes>
  buildReactPlugins: ReturnType<typeof buildReactPlugins>
}


export interface EditorProps extends HTMLProps<HTMLDivElement> {
  onInit: (element: HTMLDivElement, factory: EditorFactoryProps) => void
  innerRef?: ForwardedRef<HTMLDivElement | null>;
}

export class Editor extends React.Component<EditorProps, EditorState> {
  editorRef: React.RefObject<any>
  initialized: boolean

  constructor(props: EditorProps) {
    super(props)

    this.editorRef = React.createRef()
    this.initialized = false

    this.state = {
      renderers: {},
    }
  }

  componentDidMount() {
    this.init()
  }

  componentDidUpdate() {
    this.init()
  }

  init() {
    this.initialized = true
  }

  maybeFlushSync(fn: () => void) {
    // Avoid calling flushSync until the editor is initialized.
    // Initialization happens during the componentDidMount or componentDidUpdate
    // lifecycle methods, and React doesn't allow calling flushSync from inside
    // a lifecycle method.
    if (this.initialized) {
      flushSync(fn)
    } else {
      fn()
    }
  }

  register = (element: HTMLDivElement) => {
    if (!element || element.firstChild)
      return

    const content: EditorContent = {
      removeRenderer: this.removeRenderer,
      setRenderer: this.setRenderer,
    }

    const factory: EditorFactoryProps = {
      buildReactNodes: buildReactNodes(content),
      buildReactPlugins: buildReactPlugins(content),
    }

    this.props.onInit(element, factory)
  }

  setRenderer = (id: string, renderer: ReactRenderer) => {
    this.maybeFlushSync(() => {
      this.setState(({ renderers }) => ({
        renderers: {
          ...renderers,
          [id]: renderer,
        },
      }))
    })
  }

  removeRenderer = (id: string) => {
    this.maybeFlushSync(() => {
      this.setState(({ renderers }) => {
        const nextRenderers = { ...renderers }

        delete nextRenderers[id]

        return { renderers: nextRenderers }
      })
    })
  }

  componentWillUnmount() {
    this.initialized = false
  }

  render() {
    const { innerRef, onInit, ...rest } = this.props

    return (
      <>
        <div ref={this.register} {...rest} />
        <Portals renderers={this.state.renderers} />
      </>
    )
  }
}