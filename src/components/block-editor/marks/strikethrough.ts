import { toggleMark } from 'prosemirror-commands'
import { Mark } from '~/lib/vault-prosemirror'
import { markInputRule } from '../utils/mark-input-rule'

export const StrikethroughMark = Mark.create({
  name: 'strikethrough',
  spec() {
    return {
      parseDOM: [
        {
          tag: "s",
        },
        {
          tag: "del",
        },
        {
          tag: "strike",
        },
        {
          style: "text-decoration",
          getAttrs: (value) => (value === "line-through" ? null : false),
        },
      ],
      toDOM: () => ["del", 0],
    }
  },
  inputRules({ type }) {
    return [markInputRule(/~([^~]+)~/, type)]
  },
  keymap({ type }) {
    return {
      "Mod-d": toggleMark(type),
    };
  },
})