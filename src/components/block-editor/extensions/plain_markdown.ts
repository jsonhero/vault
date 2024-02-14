import { InputRule, inputRules } from 'prosemirror-inputrules'
import { MarkType, ResolvedPos } from 'prosemirror-model';
import { NodeSelection, Plugin, TextSelection } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Extension } from '~/lib/vault-prosemirror'



const headerRule = new InputRule(/^(#+)(\s+)/, (state, match, start, end) => {

  const $start = state.doc.resolve(start)
  
  if ($start.parent.type.name === 'paragraph') {
    const { tr, selection } = state;
    const { $from, $to } = selection;
    const block = $from.blockRange($to);

    console.log(match, 'block')

    const headingLevel = match[1].length
    const heading = state.schema.nodes.heading.create({
      level: headingLevel,
    }, $start.parent.content)

    // return state.tr.replaceWith(block!.start, block!.end, header)

    
    return state.tr.setBlockType(start, end, state.schema.nodes.heading, {
      level: headingLevel
    }).deleteRange(start, end)
  }

  return null
})

const boldRule = new InputRule(/\*\*([^*]+)\*\*/, (state, match, start, end) => {
  return state.tr.addMark(start, end, state.schema.marks.strong.create())
    .insertText(match[1], start, end)
    .removeStoredMark(state.schema.marks.strong)
})

function markRange ($cursor: ResolvedPos, markType: MarkType, offset = 0) {
  // let startPos = $cursor.start()
  // let endPos = startPos

  const hasMark = (index: number) => 
    markType.isInSet($cursor.parent.child(index).marks)

  const pos = $cursor.pos + offset

  
  let startPos = $cursor.start()
  for (let i = 0; i < $cursor.parent.childCount; i++) {
    const nodeSize = $cursor.parent.child(i).nodeSize

    const childEndPos = startPos + nodeSize

    if (pos <= childEndPos && pos >= startPos && hasMark(i)) {
      return {
        to: childEndPos,
        from: startPos,
        marks: $cursor.parent.child(i).marks
      }
    } else {
      startPos = childEndPos
    }
  }

  return null

  let startIndex = $cursor.index()
  let endIndex = $cursor.indexAfter()




    console.log(startIndex, endIndex, 'index')
  let isMarked = false 

  // Clicked outside edge of tag.


  if (startIndex === $cursor.parent.childCount) {
    startIndex--;
  }

  const end = endIndex
  for (let i = startIndex; i < end; i++) {
    const indexMark = hasMark(i)

    if (indexMark) {
      isMarked = true
    }

  }
  
  while (startIndex > 0 && hasMark(startIndex)) {
    startIndex--;
  }
  while ( endIndex < $cursor.parent.childCount && hasMark(endIndex)) {
    endIndex++
  }

  if (!isMarked) {
    return null
  }

  // let startPos = $cursor.start()
  // let endPos = startPos

  // for (let i = 0; i < endIndex; i++) {
  //   const size = $cursor.parent.child(i).nodeSize;
  //   if (i < startIndex) startPos += size;
  //   endPos += size;
  // }

  // return { from: startPos, to: endPos };
}

const markdownPlugin: Plugin = new Plugin({
  state: {
    init(config, instance) {
      return {
        decorations: DecorationSet.empty
      }
    },
    apply(tr, state) {
      const meta = tr.getMeta(markdownPlugin)

      if (meta?.action === 'select_bold') {
        const { range } = meta
        console.log(range, 'new range')

        // const dec = Decoration.widget(range.from, range.to, {
        //   class: 'editing-bold'
        // }, {
        //   inclusiveEnd: true,
        //   inclusiveStart: true,
        // })

        // https://discuss.prosemirror.net/t/decorations-new-content-appearing-before-widget-with-side-1/3913/7

        const startDec = Decoration.widget(range.from, (view, getPos) => {
          const span = document.createElement('span')

          span.innerHTML = '**'
          return span
        }, {
          key: '1',
          ignoreSelection: false,
          // marks: range.marks,
          side: -1,

        })
        const endDec = Decoration.widget(range.to, (view, getPos) => {
          const span = document.createElement('span')

          span.innerHTML = '**'
          return span
        }, {
          key: '2',
          ignoreSelection: true,
          // marks: range.marks,
          side: 1,
        })

        return {
          decorations: DecorationSet.create(tr.doc, [startDec, endDec])
        }
        
      } else if (meta?.action === 'unselect_bold') {
        return {
          decorations: DecorationSet.empty
        }
      }

      
      return {
        decorations: state.decorations.map(tr.mapping, tr.doc)
      }
    },
  },
  // filterTransaction(tr, state) {
  

  // Test __thing__
  // Test |**bold**|
  // },
  appendTransaction(transactions, oldState, newState) {
    if (oldState.selection !== newState.selection) {
      const { doc } = newState
      let tr = newState.tr


      // if (newState.selection.empty) {
      //   const marks = doc.nodeAt(newState.selection.from)?.marks
      //   if (marks && marks.length > 0) {
      //     // newState.tr.marks
      //     console.log('set stored marks', marks, tr.storedMarks)
      //     tr = newState.tr.setStoredMarks(marks)
      //   }
      // }

      const { from, to, $from } = newState.selection;
      // Do something with the selection, such as updating UI or triggering other actions
      // console.log("Selection updated:", from, to);

      // console.log($from.parent)

      // 


      const range = markRange($from, newState.schema.marks.strong)

      const state = markdownPlugin.getState(newState)
      const isDecorated = state.decorations.find().length

      if (range && !isDecorated) {
        const pos = $from.pos

        const data = { 
          action: 'select_bold',
          range: {
            from: range.from,
            to: range.to,
          } 
        }

        if (pos === range.from) {
          console.log('preselect')
        } else if (pos === (range.from + 1)) {
          tr = tr.setSelection(TextSelection.create(tr.doc, $from.pos - 1))  
          return tr.setMeta(markdownPlugin, data)
        } else if (pos === (range.to - 1)) {
          tr = tr.setSelection(TextSelection.create(tr.doc, $from.pos + 1))  
          return tr.setMeta(markdownPlugin, data)
        }
      } else if (!range && isDecorated) {
        const pos = $from.pos

        const prevRange = markRange(oldState.selection.$from, newState.schema.marks.strong)

        const data = {
          action: 'unselect_bold'
        }

        console.log(prevRange, pos, 'prev')

        if ((pos + 1) === prevRange?.from) {
          tr = tr.setSelection(TextSelection.create(tr.doc, $from.pos + 1))
          return tr.setMeta(markdownPlugin, data)
        } else if ((pos - 1) === prevRange?.to) {
          tr = tr.setSelection(TextSelection.create(tr.doc, $from.pos -1))
          return tr.setMeta(markdownPlugin, data)
        }


      }
      

      // If was in range before, and current selection is out of range, then remove
      // if (!range && state.decorations.find().length) {
      //   const isStart = prevRange && newState.selection.from <= prevRange.from

      //   console.log(':: unselect', prevRange)
      //   const data = { action: 'unselect_bold', range }
      //   tr = tr.setMeta(markdownPlugin, data)

      //   if (isStart) {
      //     tr = tr.setSelection(TextSelection.create(tr.doc, $from.pos + 1))
      //   }

      //   return tr
      // }

      // if (range && state.decorations.find().length === 0) {
      //   const isStart = oldState.selection.from <= range.from

      //   console.log(':: select', isStart, range.from, oldState.selection.from)
      //   const data = { action: 'select_bold', range }

      //   if (isStart) {
      //     tr = tr.setSelection(TextSelection.create(tr.doc, $from.pos - 1))
      //   }

      //   return tr.setMeta(markdownPlugin, data)




      //   // const textOffset = newState.selection.$anchor.parentOffset


      //   // const nodeStart = $from.pos - node.nodeSize;
      //   // const nodeEnd = $from.pos + node.nodeSize;

      //   // const [bold] = node.marks
      //   // console.log(nodeStart, nodeEnd, textOffset, 'node')
      //   // console.log(NodeSelection.create(newState.tr.doc, from))
              
      // }

      
    }

    return null
  },
  props: {
    decorations: (state) => markdownPlugin.getState(state)?.decorations,
    handleTextInput(view, from, to, text) {
      const { state } = view

      if (state.selection.empty) {
        const marks = state.doc.nodeAt(view.state.selection.from)?.marks
        const pluginState = markdownPlugin.getState(state)

        if (marks && pluginState.decorations.find().length) {
          view.dispatch(state.tr.setStoredMarks(marks))
          console.log(marks, ':: markies')
        }
      }


      return false
    },
  }
})


export const MarkdownExtension = Extension.create({
  proseMirrorPlugins() {
    return [
      markdownPlugin,
      inputRules({
        rules: [headerRule, boldRule]
      })
    ]
  }
})