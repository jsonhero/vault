import { getSchema } from "~/lib/vault-prosemirror/helpers";

import { nodes } from './nodes'

export const schema = getSchema({
  nodes,
})