import { EditorState, Plugin, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

import { useNodeViewContext, useWidgetViewContext } from '@prosemirror-adapter/react'
import { joinTextblockBackward } from 'prosemirror-commands'

export const lineNumberPlugin: Plugin = new Plugin({
  state: {
    init(_, state) {
      const decSet = createLineNumberDecorations(state)
      return decSet
    },
    apply(tr, set) { return set.map(tr.mapping, tr.doc) }
  },
  props: {
    decorations(state) {
      // Need to optimize this
      return createLineNumberDecorations(state)
      // return lineNumberPlugin.getState(state)
    }
  }
})

// Function to create line number decorations
function createLineNumberDecorations(state: EditorState) {
  const decorations: Decoration[] = [];
  const doc = state.doc;

  // iterate the doc to find the offset of the previous index

  doc.forEach((node, offset, idx) => {
    if (node.type.name === 'lineblock') {
      const lineNo = idx + 1;
      const decoration = Decoration.widget(offset + 1, renderLineNumber(lineNo), {
        side: -1,
        key: lineNo + '',
      });
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
function renderLineNumber(lineNo: number) {
  const element = document.createElement('span');
  element.className = 'line-number mr-3 select-none';
  element.textContent = lineNo + '';
  return element;
}