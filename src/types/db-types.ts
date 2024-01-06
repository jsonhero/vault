export interface EntityDocument {
  id: number
  entity_id: number;
  doc: any
}

export interface Entity {
  id: number;
  title: string;
  type: 'table' | 'document' | 'table_record';
  data_schema_id: number;
  data: any;
}

export interface DataSchemaValue {
  columns: {
    id: string;
    name: string;
    type: string;
  }[]
}


export interface DataSchema {
  id: number;
  schema: DataSchemaValue
}