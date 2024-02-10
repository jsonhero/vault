import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Component } from "react";
import { Extension, Editor } from "~/lib/vault-prosemirror";
import { ReactRenderer } from "~/lib/vault-prosemirror/react";
import { focusBlock, isBlockHidden, isBlockGroupHidden, hideBlockList, showBlockList } from "./lineblock";
import { Node } from "prosemirror-model";
import { CircleDotIcon, DotIcon, ChevronRight, ChevronDown } from "lucide-react";


const GutterPluginKey = new PluginKey("gutter-plugin-key")



interface TextEditorGutterProps {
  view: EditorView | null
  editor: Editor
  hideLineNumbers?: boolean
}

interface TextEditorGutterState {
  lines: any[]
}

// need to optimize this..
class TextEditorGutter extends Component<TextEditorGutterProps, TextEditorGutterState> {

  observer?: ResizeObserver

  constructor(props: TextEditorGutterProps) {
    super(props)
    this.state = {
      lines: []
    }
  }

  static getUpdatedLines(view: EditorView) {
    const nextLines: any[] = []

    let previousNode: Node | null = null
    let groupDepths: { [key: number]: number } = {}

    if (view.isDestroyed) return []

    view.state.doc.forEach((node, offset, i) => {

      if (node.type.name === 'lineblock') {

        const nodeElement = view.nodeDOM(offset) as HTMLDivElement

        const hidden = isBlockHidden(view, offset, offset + node.nodeSize)
        const groupHidden = isBlockGroupHidden(view, offset, offset + node.nodeSize)

        const nodeHeight = nodeElement?.clientHeight || 0

        const prevDepth = previousNode?.attrs.depth
        const depth = node.attrs.depth

        if (depth < prevDepth) {
          delete groupDepths[prevDepth]
        }

        if (depth in groupDepths) {
          delete groupDepths[depth]
        }

        if (previousNode !== null && depth > prevDepth) {
          groupDepths[prevDepth] = i - 1
          const line = nextLines[i - 1]
          line.isGroupNode = true
        }

        for (let d = 0; d <= depth; d++) {
          const groupIdx = groupDepths[d]
          const root = nextLines[groupIdx]

          if (root) {
            if (!hidden) {
              root.groupHeight += nodeHeight
            }
            root.groupEndPos = offset
          }
        }
        
        previousNode = node
        nextLines.push({
          node,
          hidden,
          groupHidden: groupHidden,
          isGroupNode: false,
          lineNumber: i + 1,
          groupStartPos: offset,
          groupEndPos: offset,
          groupHeight: 0,
          depth,
          height: nodeHeight
        })
      }

    })

    return nextLines.filter((line) => !line.hidden)
  }


  static getDerivedStateFromProps(props: TextEditorGutterProps, state: TextEditorGutterState) {

    if (!props.view) {
      return state
    }

    return {
      lines: TextEditorGutter.getUpdatedLines(props.view)
    }
  }

  componentDidMount(): void {
    const mirror = document.querySelector(`[data-editor-id='${this.props.editor.id}'] .ProseMirror`)

    this.observer = new ResizeObserver((entries) => {
      const view = this.props.view

      if (view) {
        this.setState({
          lines: TextEditorGutter.getUpdatedLines(view)
        })
      }
    })

    if (mirror) {
      this.observer.observe(mirror)
    }
  }

  componentWillUnmount(): void {  
    this.observer?.disconnect()
  }
  
  onFocusList = (line: any) => {


    const view = this.props.view!

    focusBlock(view, line.node.attrs.blockId)

    // if (line.groupStartPos !== line.groupEndPos)  {
    //   const positions: number[] = []
    //   view?.state.doc.nodesBetween(line.groupStartPos, line.groupEndPos + 1, (node, pos) => {
    //     positions.push(pos)
    //     return false;
    //   })

    //   const hidden = !line.node.attrs.groupHidden
    
    //   let tr = view.state.tr

    //   positions.forEach((pos) => {
    //     if (pos !== line.groupStartPos) {
    //       tr = tr.setNodeAttribute(pos, "hidden", hidden)
    //       tr = tr.setNodeAttribute(pos, "groupHidden", hidden)
    //     } else {
    //       tr = tr.setNodeAttribute(pos, "groupHidden", hidden)
    //     }
    //   })

    //   view.dispatch(tr)
    // }
  
  }

  onToggleList = (line: any) => {
    const view = this.props.view!

    if (line.groupHidden) {
      console.log('show list?')
      showBlockList(view, line.node.attrs.blockId)
    } else {
      hideBlockList(view, line.node.attrs.blockId)
    }
  }

  render() {
    const view = this.props.view

    let selectedBlockId = null
    if (view) {
      const linePos = view.state.selection.$anchor.before(1)
      const node = view.state.doc.nodeAt(linePos)

      selectedBlockId = node?.attrs.blockId
    }


    const minDepth = this.state.lines.reduce((min, line) => (min === null || line.depth < min) ? line.depth : min, null)


    return (
      <div className="sticky z-50">
        <div className="flex flex-col flex-shrink-0 min-w-[38px]">
          {this.state.lines.map((line: any, i: number) => {
            return (
              <div className="group flex items-center justify-between relative">
                <div className="text-gray-600" style={{ height: line.height }}>
                  {this.props.hideLineNumbers ? '' : line.lineNumber }
                </div>
                <div className="absolute flex items-center" style={{
                  left: 24 + ((line.depth - minDepth) * 24) + 'px',
                  height: line.height
                }}>
                  <div className="w-[16px] h-[16px]">
                    {line.isGroupNode && line.node.attrs.blockId === selectedBlockId && (
                      <button className="flex items-center justify-center" onClick={() => this.onToggleList(line)}>
                        {line.groupHidden ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>
                  {(line.depth > 0 || line.isGroupNode || (line.node.attrs.blockId === selectedBlockId)) && (
                    <button 
                      style={{
                        background: line.groupHidden && 'rgba(255, 255, 255, 0.15)'
                      }}
                      className="flex justify-center items-center w-[16px] h-[16px] rounded-medium" onClick={() => this.onFocusList(line)}>
                      <div style={{
                        width: 4,
                        height: 4,
                        background: 'white',
                        borderRadius: '50%'
                      }}></div>
                    </button>
                  )}
                  {line.groupHeight > 0 && (
                    <div className="absolute left-[22px] w-[1px] bg-gray-700 group-hover:bg-gray-400 group-hover:z-10" style={{
                      top: (line.height - 4)  + 'px',
                      height: line.groupHeight + 'px'
                    }}>
                      
                    </div>
                  )}
                  
                </div>
  
              </div>
            )
          })}
        </div>
      </div>
    )
  }

}

interface GutterExtensionOptions {
  hideLineNumbers?: boolean
}

export const GutterExtension = Extension.create<GutterExtensionOptions>({
  name: 'gutter',
  proseMirrorPlugins() {
    let component: ReactRenderer | null;
    const editor = this.editor
    const options = this.options

    const gutterEl = document.querySelector(`[data-editor-id='${this.editor.id}'] .editor-row .editor-gutter`)
    // const gutterEl = document.createElement('div')
    // gutterEl.className = 'editor-gutter';
    // editorContainer?.prepend(gutterEl);

    const plugin: Plugin = new Plugin({
      key: GutterPluginKey,
      view(view) {
       component = new ReactRenderer(TextEditorGutter, {
         editor,
         as: gutterEl,
         props: {
          hideLineNumbers: options.hideLineNumbers,
          view,
          editor,
         }
       })

       return {
         update(view) {
           setTimeout(() => {
             component?.updateProps({ view })
           })
         },
         destroy() {

          setTimeout(() => {
            component?.destroy()
          })
          //  gutterEl.remove()
         },
       }
      },
   })

   return [plugin]
  },
})