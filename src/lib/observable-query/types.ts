import { 
  AggregateFunctionNode,
  SelectQueryNode,
  ReferenceNode,
  SelectAllNode,
  ColumnNode,
  TableNode,
  AliasNode,
  RawNode,
  Kysely,
  SelectQueryBuilder
} from "kysely";

export type QueryId = { queryId: string };

export type Node =
  | SelectQueryNode
  | TableNode
  | ColumnNode
  | ReferenceNode
  | RawNode
  | AggregateFunctionNode
  | AliasNode
  | SelectAllNode;

type Schema<T> = T extends { TYPE: infer U } ? U : unknown;

export type QueryFn<T, A extends any[], K> = (db: Kysely<K>, ...args: A) => SelectQueryBuilder<Kysely<K>, any, T>
