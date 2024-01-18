import { Kysely, JSONColumnType, Generated, ColumnType, Insertable } from 'kysely'

export interface EntityTable {
  id: Generated<number>;
  title: string;
  type: 'table' | 'document' | 'table_record';
  data_schema_id: number;
  data: {
    values: {
      [key: string]: string
    }
  } | null;
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

export interface DB {
  entity: EntityTable;
  data_schema: DataSchemaTable;
}

export type NewEntity = Insertable<EntityTable>