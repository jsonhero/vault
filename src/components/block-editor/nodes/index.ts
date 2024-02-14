import { Node } from '~/lib/vault-prosemirror'

import { DocumentNode } from './doc'
import { TextNode } from './text'
import { ParagraphNode } from './paragraph'
import { HashtagNode } from './hashtag'
import { LineblockNode } from './lineblock'
import { ReferenceNode } from './reference'
import { EntityRecordNode } from './entity-record'
import { HeadingNode } from './heading'

export const nodes: Node[] = [
  DocumentNode,
  TextNode,
  ParagraphNode,
  HeadingNode,
  LineblockNode,
  HashtagNode,
  ReferenceNode,
  EntityRecordNode,
]