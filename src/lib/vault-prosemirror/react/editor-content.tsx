import React, {
  ForwardedRef, forwardRef, HTMLProps, LegacyRef, MutableRefObject, useMemo
} from 'react'
import ReactDOM, { flushSync } from 'react-dom'

import { Editor } from '../editor'
import type { ReactRenderer } from './react-renderer'

const Portals: React.FC<{ renderers: Record<string, ReactRenderer> }> = ({ renderers }) => {

  const portals = useMemo(() => {
    return Object.entries(renderers).map(([key, renderer]) => {
      return ReactDOM.createPortal(renderer.reactElement, renderer.element, key)
    })
  }, [renderers])

  return (
    <>
      {portals}
    </>
  )
}

export interface EditorContentState {
  renderers: Record<string, any>;
}

export interface EditorContentProps extends HTMLProps<HTMLDivElement> {
  editor: Editor | null
  innerRef?: ForwardedRef<HTMLDivElement | null>;
}

export class EditorContent extends React.Component<EditorContentProps, EditorContentState> {
  editorRef: React.RefObject<HTMLDivElement>
  initialized: boolean

  constructor(props: EditorContentProps) {
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

    if (this.props.editor && !this.props.editor.editorElement) {
      this.initialized = true
  
      if (this.editorRef.current) {
        this.props.editor.mount(this.editorRef.current)
        this.props.editor.setRenderer({
          removeRenderer: this.removeRenderer,
          setRenderer: this.setRenderer,
        })
      }
    }

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
    const { innerRef, editor, ...rest } = this.props

    return (
      <>
        <div ref={this.editorRef} {...rest} />
        <Portals renderers={this.state.renderers} />
      </>
    )
  }
}