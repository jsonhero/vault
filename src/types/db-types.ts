export interface EntityDocument {
  id: number
  entity_id: number;
  doc: any
  doc_text: any
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

type columnType = 'text' | 'number' | 'title' | 'boolean' | 'select' | 'multi-select' | 'date' | 'reference' | 'json' | 'to_refs' | 'from_refs'
// json is basically a sub table...

const dataschema = {
  columns: [
    {
      id: 1,
      name: 'Display',
      type: 'text',
      meta: {}
    },
    {
      id: 2,
      name: 'Display',
      type: 'number',
      meta: {
        min: '',
        max: '',
        type: 'currency'
      },
    },
    {
      id: 3,
      name: 'Display',
      type: 'relation',
      meta: { // graph relation category would let us know which relations to query for this column
        allowed_table_list: [], // could link to many different tables 
        limit: 1 // num of relations allowed
      }
    }
  ]
}

const table_record = {
  updated_at: 'timestamp',
  values: {
    1: {
      type: 'number',
      value: 2,
      updated_at: 'timestamp',
    },
    2: {
      type: 'relation',
      value: [1, 2, 3, 4] // entity ids
    },
    3: {
      type: 'multi-select',
      value: ['first', 'second', 'third']
    },

  }
}

const file_tree_state = [
  {
    id: 1,
    type: 'entity',
  },
  {
    id: 2,
    type: 'folder',
    title: 'Some Folder',
    meta: {
      // maybe used for virtual folders, tables that filter?
    },
    contents: [{
      id: 4,
      type: 'entity',
      meta: {
        entityId: 1
      }
    }]
  },
  {
    type: 'entity',
  }
]


// history???
const window_state = {
  windows: [
    {
      id: 1,
      direction: 'right',
      tabs: [
        {
          type: 'entity',
          entityId: 4,
        }
      ]
    },
    {
      id: 2,
      direction: 'left',
      tabs: [
        {
          type: 'entity',
          entityId: 3,
        }
      ]
    }
  ]
}