import { Mark } from '~/lib/vault-prosemirror'

import { BoldMark } from './bold'
import { ItalicMark } from './italic'
import { StrikethroughMark } from './strikethrough'

export const marks: Mark[] = [
  BoldMark,
  ItalicMark,
  StrikethroughMark
]