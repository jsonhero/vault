import { getSchema } from "~/lib/vault-prosemirror/helpers";

import { nodes } from './nodes'
import { marks } from './marks'

export const schema = getSchema({
  nodes,
  marks,
})