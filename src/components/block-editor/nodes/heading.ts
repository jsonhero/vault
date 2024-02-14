import { InputRule } from 'prosemirror-inputrules'
import { Node } from '~/lib/vault-prosemirror'


export const HeadingNode = Node.create({
  name: 'heading',
  spec() {
    return {
      attrs: {level: {default: 1}},
      content: "text*",
      group: "block",
      defining: true,
      parseDOM: [{tag: "h1", attrs: {level: 1}},
                {tag: "h2", attrs: {level: 2}},
                {tag: "h3", attrs: {level: 3}},
                {tag: "h4", attrs: {level: 4}},
                {tag: "h5", attrs: {level: 5}},
                {tag: "h6", attrs: {level: 6}}],
      toDOM(node) { return ["h" + node.attrs.level, 0] }
    }
  },
  inputRules({ type }) {
    return [new InputRule(/^(#+)(\s+)/, (state, match, start, end) => {

      const $start = state.doc.resolve(start)
      
      if ($start.parent.type.name === 'paragraph') {
        const { tr, selection } = state;
        const { $from, $to } = selection;
        const block = $from.blockRange($to);
        
        const headingLevel = match[1].length
        const heading = type.create({
          level: headingLevel,
        }, $start.parent.content)
    
        // return state.tr.replaceWith(block!.start, block!.end, header)
    
        
        return state.tr.setBlockType(start, end, type, {
          level: headingLevel
        }).deleteRange(start, end)
      }
    
      return null
    })]
  }, 
})