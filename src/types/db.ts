import { Kysely, JSONColumnType, Generated, ColumnType, Insertable } from 'kysely'

export interface EntityTable {
  id: Generated<number>;
  title: string;
  type: 'table' | 'document' | 'table_record';
  data_schema_id?: number;
  data: {
    values: {
      [key: string]: string
    }
  } | null;
  extension_id?: string
  updated_at: ColumnType<Date, string | undefined, never>;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface DataSchemaTable {
  id: Generated<number>;
  schema: {
    columns: {
      id: string;
      name: string;
      type: string;
    }[];
  };
}

export interface EntityFTS {
  rowid: number;
}

export interface DocumentTable {
  id: Generated<number>;
  entity_id: number;
  doc?: any;
  doc_text?: string
  manifest?: {
    taggedBlocks: {
      blockId: string;
      tags: string[]
    }[]
  }
}

export interface AppStateTable {
  id: Generated<number>;
  type: 'file_tree' | 'window_state' | 'extension_state',
  data: any
  updated_at: ColumnType<Date, string | undefined, never>;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface EntityGraphTable {
  id: Generated<number>;
  entity_id: number
  to_entity_id: number
  category?: string
}

export interface DB {
  entity: EntityTable;
  data_schema: DataSchemaTable;
  entity_fts: EntityFTS;
  document: DocumentTable;
  app_state: AppStateTable;
  entity_graph: EntityGraphTable;
}

export type NewEntity = Insertable<EntityTable>