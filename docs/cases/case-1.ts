


// maybe start with all in main doc for now...  
// idk how collab would work yet with mini block syncing (and their subblocks too)
// maybe update maindoc + blockdoc at same time, but might get weird desycning.

const entities = [
  {
    id: 1,
    title: 'My daily journal {{today}}',
    type: 'document',
    ref_id: 11,
  },
  {
    id: 2,
    title: '#roses', // locked, dynamic ?
    type: 'reference_document',
    ref_id: 22,
  },
  {
    id: 3,
    title: '#thorns',
    type: 'reference_document',
    ref_id: 33,
  },
  {
    id: 4,
    title: null,
    type: 'block_document',
  },
  {
    id: 5,
    title: null,
    type: 'block_document',
  }
]

const documents = [
  // main doc
  {
    entity_id: 1,
    doc: '... full daily journal text (with snippets)...'
  },
  // main doc blocks, sync with main doc when individually edited outside of doc scope
  {
    entity_id: 4,
    doc: '...daily journal snippet #roses...'
  },
  {
    entity_id: 5,
    doc: '...daily journal snippet #thorns...'
  }
]


const references = [
  {
    id: 11,
    entity_id: 1,
  },
  {
    id: 22,
    entity_id: 2,
  },
  {
    id: 33,
    entity_id: 3,
  },

  // links

  // Document -> block documents : loaded with document

  {
    id: 110,
    entity_id: 1,
    to_entity_id: 4,
    type: 'block_reference'
  },
  {
    id: 220,
    entity_id: 1,
    to_entity_id: 5,
    type: 'block_reference'
  },

  // Block docs -> Block docs
  {
    id: 115,
    entity_id: 4, // #thorns
    to_entity_id: 45, // #nutrition
    type: 'block_reference'
  },


  // Block documents -> hash links : loaded with hash
  {
    id: 111,
    entity_id: 4,
    to_entity_id: 2, // #thorns
    type: 'hash_link',
    value: '#thorns'
  },
  {
    id: 115,
    entity_id: 45,
    to_entity_id: 6, // #nutrition
    type: 'hash_link',
    value: '#nutrition',
  },
  {
    id: 222,
    entity_id: 5,
    to_entity_id: 3, // #roses
    type: 'hash_link',
    value: '#roses'
  },
  
]