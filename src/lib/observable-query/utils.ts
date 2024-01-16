import { Node } from './types'

export function getUsedTables(target: Node): string[] {
  if (Array.isArray(target)) {
    const tables = new Set<string>();
    for (let i = 3; i < target.length; i += 8) tables.add(target[i] as string);
    return [...tables];
  }
  if (target.kind === "TableNode") {
    return [target.table.identifier.name];
  }
  if (target.kind === "ReferenceNode" && target.table) {
    return [target.table.table.identifier.name];
  }
  if (target.kind === "AliasNode") {
    return getUsedTables(target.node as Node);
  }

  if (target.kind === "SelectQueryNode") {
    const tables = (
      [
        ...(target.from?.froms || []),
        ...(target.joins?.map((x) => x.table) || []),
        ...(target.selections?.map((x) => x.selection) || []),
        ...(target.with?.expressions.map((x) => x.expression) || []),
      ] as Node[]
    ).flatMap(getUsedTables);
    return [...new Set(tables)];
  }
  return [];
}