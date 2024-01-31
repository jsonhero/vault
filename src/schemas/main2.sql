CREATE TABLE IF NOT EXISTS data_schema (
  id INTEGER PRIMARY KEY NOT NULL,
  schema TEXT DEFAULT NULL
);
SELECT crsql_as_crr('data_schema');


CREATE TABLE IF NOT EXISTS entity (
    id INTEGER PRIMARY KEY NOT NULL,
    title TEXT DEFAULT '',
    type TEXT,
    data_schema_id INTEGER DEFAULT NULL,
    data TEXT DEFAULT NULL,
    extension_id TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SELECT crsql_as_crr('entity');

CREATE TABLE IF NOT EXISTS entity_graph (
    id INTEGER PRIMARY KEY NOT NULL,
    entity_id INTEGER,
    to_entity_id INTEGER,
    category TEXT DEFAULT NULL
);
SELECT crsql_as_crr('entity_graph');

CREATE TABLE IF NOT EXISTS document (
    id INTEGER PRIMARY KEY NOT NULL,
    entity_id INTEGER,
    doc TEXT DEFAULT NULL,
    doc_text DEFAULT '',
    manifest TEXT DEFAULT NULL
);

SELECT crsql_as_crr('document');

CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY NOT NULL,
    type TEXT,
    data TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SELECT crsql_as_crr('app_state');


CREATE VIEW IF NOT EXISTS search_vw AS 
SELECT entity.id, entity.title, d.doc_text FROM entity
    LEFT JOIN document d ON d.entity_id = entity.id
;

-- virtual

-- will probably need to implement two FTS tables, one for when text is < 3 length, and trigram for > 3
CREATE VIRTUAL TABLE IF NOT EXISTS entity_fts USING fts5 (
  title,
  doc_text,
  content='search_vw',
  content_rowid='id',
  tokenize="trigram"
);

-- entity triggers

CREATE TRIGGER IF NOT EXISTS entity_fts_insert AFTER INSERT ON entity BEGIN
    INSERT INTO entity_fts(rowid, title) VALUES (NEW.id, NEW.title);
END;

CREATE TRIGGER IF NOT EXISTS entity_fts_update AFTER UPDATE OF title ON entity WHEN (OLD.title IS NOT NEW.title) BEGIN
    INSERT INTO entity_fts(entity_fts, rowid, title) VALUES ('delete', OLD.id, OLD.title);
    INSERT INTO entity_fts(rowid, title) VALUES (NEW.id, NEW.title);
END;

CREATE TRIGGER IF NOT EXISTS document_fts_update AFTER UPDATE OF doc_text ON document WHEN (OLD.doc_text IS NOT NEW.doc_text) BEGIN
    INSERT INTO entity_fts(entity_fts, rowid, doc_text) VALUES ('delete', OLD.entity_id, OLD.doc_text);
    INSERT INTO entity_fts(rowid, doc_text) VALUES (NEW.entity_id, NEW.doc_text);
END;

CREATE TRIGGER IF NOT EXISTS entity_updated_at AFTER UPDATE ON entity FOR EACH ROW WHEN NEW.updated_at <= OLD.updated_at BEGIN
    UPDATE entity SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;