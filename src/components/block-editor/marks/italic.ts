import { toggleMark } from 'prosemirror-commands'
import { MarkSpec } from 'prosemirror-model'
import { Mark } from '~/lib/vault-prosemirror'
import { markInputRule } from '../utils/mark-input-rule'

export const ItalicMark = Mark.create({
  name: 'em',
  spec() {
    return {
      parseDOM: [
        { tag: "i" },
        { tag: "em" },
        {
          style: "font-style",
          getAttrs: (value) => (value === "italic" ? null : false),
        },
      ],
      toDOM() { return  ["em"] }
    } as MarkSpec
  },
  inputRules({ type }) {
    return [markInputRule(/\*([^*]+)\*/, type)]
  },
  keymap({ type }) {
    return {
      "Mod-i": toggleMark(type),
      "Mod-I": toggleMark(type),
    };
  },
})