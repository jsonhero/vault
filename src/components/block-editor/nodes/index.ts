import { Node } from '~/lib/vault-prosemirror'

import {
  DocumentNode,
  TextNode,
  ParagraphNode,
} from './base'
import { HashtagNode } from './hashtag'
import { LineblockNode } from './lineblock'
import { ReferenceNode } from './reference'
import { EntityRecordNode } from './entity-record'

export const nodes: Node[] = [
  DocumentNode,
  TextNode,
  ParagraphNode,
  LineblockNode,
  HashtagNode,
  ReferenceNode,
  EntityRecordNode,
]