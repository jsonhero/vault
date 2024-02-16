import { Mark } from '~/lib/vault-prosemirror'

import { BoldMark } from './bold'
import { ItalicMark } from './italic'
import { StrikethroughMark } from './strikethrough'
import { HashtagMark } from './hashtag'

export const marks: Mark[] = [
  BoldMark,
  ItalicMark,
  StrikethroughMark,
  HashtagMark
]