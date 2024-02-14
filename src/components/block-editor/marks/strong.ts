import { DOMOutputSpec, MarkSpec } from 'prosemirror-model'
import { Mark } from '~/lib/vault-prosemirror'

const strongDOM: DOMOutputSpec = ["strong", 0]

export const StrongMark = Mark.create({
  name: 'strong',
  spec() {
    return {
      // inclusive: false,
      parseDOM: [
        {tag: "strong"},
        // This works around a Google Docs misbehavior where
        // pasted content will be inexplicably wrapped in `<b>`
        // tags with a font-weight normal.
        {tag: "b", getAttrs: (node: HTMLElement) => node.style.fontWeight != "normal" && null},
        {style: "font-weight=400", clearMark: m => m.type.name == "strong"},
        {style: "font-weight", getAttrs: (value: string) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null},
      ],
      toDOM() { return strongDOM }
    } as MarkSpec
  }
})