import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model'

import { Mark } from "../mark";
import { Node } from "../node";
import { Extension } from '../extension';
import { flattenExtensions } from './flatten-extensions';

interface GetSchemaOptions {
  extensions?: Extension[]
  nodes?: Node[]
  marks?: Mark[]
}

export function getSchema(options: GetSchemaOptions): Schema {

  const {
    extensions,
    marks,
    nodes
  } = options
  
  const nodeSpecs: { [key: string]: NodeSpec } = {}
  const markSpecs: { [key: string]: MarkSpec } = {}

  let _nodes: Node[] = nodes ? [...nodes] : []
  let _marks: Mark[] = marks ? [...marks] : []

  if (extensions) {
    const allExtensions = flattenExtensions(extensions)

    allExtensions.forEach((ext) => {
      if (ext.config.nodes) {
        _nodes = [..._nodes, ...ext.config.nodes()]
      }
      if (ext.config.marks) {
        _marks = [..._marks, ...ext.config.marks()]
      }
    })

  }
  
  _nodes.forEach((node) => {
    nodeSpecs[node.config.name] = node.config.spec()
  })

  _marks.forEach((mark) => {
    markSpecs[mark.config.name] = mark.config.spec()
  })

  return new Schema({
    nodes: nodeSpecs,
    marks: markSpecs,
  })

}