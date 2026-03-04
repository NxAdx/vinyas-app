export const SCHEMA_VERSION = 1;

export const INIT_QUERIES = [
  // 1. Categories Table
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_hi TEXT,
    icon TEXT,
    gradient TEXT,
    sort_order INTEGER DEFAULT 0,
    is_system INTEGER DEFAULT 0,
    is_kosh INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 2. Ghost Links Table
  `CREATE TABLE IF NOT EXISTS ghost_links (
    id TEXT PRIMARY KEY,
    category_id TEXT,
    file_uri TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    storage_source TEXT NOT NULL,
    thumbnail_uri TEXT,
    is_available INTEGER DEFAULT 1,
    is_kosh INTEGER DEFAULT 0,
    last_accessed TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );`,

  // 3. Kosh Entries Table
  `CREATE TABLE IF NOT EXISTS kosh_entries (
    id TEXT PRIMARY KEY,
    encrypted_data BLOB NOT NULL,
    iv BLOB NOT NULL,
    tag BLOB NOT NULL,
    created_at TEXT NOT NULL
  );`,

  // 4. Collections Table
  `CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gradient TEXT,
    is_kosh INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );`,

  // 5. Collection Items Table
  `CREATE TABLE IF NOT EXISTS collection_items (
    collection_id TEXT,
    ghost_link_id TEXT,
    sort_order INTEGER DEFAULT 0,
    PRIMARY KEY (collection_id, ghost_link_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (ghost_link_id) REFERENCES ghost_links(id) ON DELETE CASCADE
  );`,

  // 6. Analytics Events Table
  `CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    category_id TEXT,
    timestamp TEXT NOT NULL,
    metadata TEXT
  );`,

  // Indices
  `CREATE INDEX IF NOT EXISTS idx_ghost_links_category ON ghost_links(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_ghost_links_source ON ghost_links(storage_source);`
];
