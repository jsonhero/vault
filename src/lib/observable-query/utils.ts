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

export function shallowEqualObjects<T>(a: T, b: T): boolean {
  if ((a && !b) || (b && !a)) {
    return false
  }

  for (const key in a) {
    if (a[key] !== b[key]) {
      return false
    }
  }

  return true
}

export function arraysShallowEqual(
  a: unknown[] | undefined,
  b: unknown[] | undefined
) {
  if (a == null || b == null) {
    return a === b;
  }

  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length && i < b.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}