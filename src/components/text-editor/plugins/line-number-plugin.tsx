import { EditorState, Plugin, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

import { WidgetDecorationFactory } from '@prosemirror-adapter/core'
import { useNodeViewContext, useWidgetViewContext, ReactWidgetViewUserOptions, ReactWidgetViewSpec,  } from '@prosemirror-adapter/react'
import { joinTextblockBackward } from 'prosemirror-commands'
import { ChevronDown, ChevronRight } from 'lucide-react'

// Function to create line number decorations
function createLineNumberDecorations(state: EditorState, widget: WidgetDecorationFactory) {
  const decorations: Decoration[] = [];
  const doc = state.doc;

  // iterate the doc to find the offset of the previous index

  console.log('Checking line numbers?')
  doc.forEach((node, offset, idx) => {
    
    if (node.type.name === 'lineblock') {
      const lineNo = idx + 1;

      let isBlockGroupRoot = false
      const blockGroupId = node.attrs.blockGroupId

      if (blockGroupId && (idx === 0 || doc.childBefore(offset).node?.attrs.blockGroupId === null)) {
        isBlockGroupRoot = true
      }

      const decoration = widget(offset + 1, {
        side: -1,
        key: node.attrs.blockId,
        nodeOffset: offset,
        isBlockGroupRoot,
        blockGroupId: node.attrs.blockGroupId,
        lineNumber: lineNo,
        // ignoreSelection: true,
      })
      decorations.push(decoration);
    }
  });

  return DecorationSet.create(doc, decorations);
}


// export const LineNumberWidget = () => {
//   const { spec } = useWidgetViewContext()

//   return (
//     <span className="line-number mr-1 select-none">1</span>
//   )
// }
// Function to render a line number
// function renderLineNumber(lineNo: number) {
//   const element = document.createElement('span');
//   element.className = 'line-number mr-3 select-none';
//   element.textContent = lineNo + '';
//   return element;
// }

const LinenumberNode = () => {
  const { spec, view } = useWidgetViewContext()

  const onClickChevron = () => {
    const child = view.state.doc.childAfter(spec?.nodeOffset)

    console.log(child.node?.textContent)

    const tr = view.state.tr.setNodeAttribute(child.offset, 'hidden', true)

    view.dispatch(tr)
    
  }

  return (
    <div className="flex items-center mr-3">
      {spec?.lineNumber}
      <div className="w-[16px] ml-1">
        {spec?.isBlockGroupRoot && <button onClick={onClickChevron} className="flex"><ChevronDown size={16} /></button>}
      </div>
    </div>
  )
}

export function createLineNumberPlugin(factory: (options: ReactWidgetViewUserOptions) => WidgetDecorationFactory) {

  const getLinenumberWidget = factory({
    as: 'div',
    component: LinenumberNode
  })
  const lineNumberPlugin: Plugin = new Plugin({
    state: {
      init(_, state) {
        const decSet = createLineNumberDecorations(state, getLinenumberWidget)
        return decSet
      },
      apply(tr, set) { 
        return set.map(tr.mapping, tr.doc) 
      }
    },
    props: {
      decorations(state) {
        // Need to optimize this
        return createLineNumberDecorations(state, getLinenumberWidget)
        // return lineNumberPlugin.getState(state)
      }
    }
  })

  return lineNumberPlugin
}