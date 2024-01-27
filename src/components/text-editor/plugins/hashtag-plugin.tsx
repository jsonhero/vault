import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";


const manifest = {
  taggedBlocks: [] 
}

export const hashtagPlugin: Plugin = new Plugin({
  // state: {
  //   init(_, state) {
  //     const decSet = createLineNumberDecorations(state)
  //     return decSet
  //   },
  //   apply(tr, set) { return set.map(tr.mapping, tr.doc) }
  // },
  props: {
    decorations(state) {
      const decorations: Decoration[] = []

      const hashRegex = new RegExp(/(^|\s)(#[a-zA-Z0-9]+)/g)

      state.doc.descendants((node, pos) => {
        if (node.type.name === 'text') {
          const text = node.text!;
          const matches = Array.from(text.matchAll(hashRegex), match => match[2]);

          for (const hash of matches) {
            const hashIndex = text.indexOf(hash);
            const start = pos + hashIndex;
            const end = start + hash.length;
            const deco = Decoration.inline(start, end, {
              class: 'text-blue-500 cursor-pointer hover:bg-secondary px-[4px] rounded-md',
            });
            decorations.push(deco);
          }
        }
      })

      return DecorationSet.create(state.doc, decorations)


      // return hashtagPlugin.getState(state)
    }
  }
})
