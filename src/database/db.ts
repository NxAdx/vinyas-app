import * as SQLite from 'expo-sqlite';
import { INIT_QUERIES } from './schema';

export async function initDatabase() {
  const db = await SQLite.openDatabaseAsync('vinyas.db');
  
  const v = await db.getFirstAsync<{ 'user_version': number }>('PRAGMA user_version');
  const dbVersion = v?.user_version || 0;
  let currentVersion = dbVersion;

  if (currentVersion === 0) {
    for (const query of INIT_QUERIES) {
      await db.execAsync(query);
    }
    currentVersion = 1;
    await db.execAsync(`PRAGMA user_version = ${currentVersion}`);
  }
  
  // Future Migrations go here:
  // if (currentVersion === 1) { ... currentVersion = 2; PRAGMA user_version = 2; }
  
  // Seed initial system categories if not present
  const result = await db.getAllAsync<{ count: number }>('SELECT count(*) as count FROM categories');
  
  if (result[0]?.count === 0) {
    const now = new Date().toISOString();
    const defaultCategories = [
      ['cat-img', 'Images', '🖼️', '["#5B8FED", "#4A3BB0"]', 1, 1, 0, now, now],
      ['cat-doc', 'Documents', '📄', '["#E85D5D", "#8B1A1A"]', 2, 1, 0, now, now],
      ['cat-vid', 'Videos', '🎬', '["#0F2027", "#2C5364"]', 3, 1, 0, now, now],
      ['cat-aud', 'Audio', '🎵', '["#B721FF", "#4822DB"]', 4, 1, 0, now, now],
      ['cat-apk', 'APKs', '📦', '["#F59E0B", "#92400E"]', 5, 1, 0, now, now],
      ['cat-kosh', 'Kosh Vault', '🔒', '["#1C2A33", "#1C2A33"]', 99, 1, 1, now, now]
    ];

    const statement = await db.prepareAsync(
      `INSERT INTO categories (id, name, icon, gradient, sort_order, is_system, is_kosh, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const cat of defaultCategories) {
      // @ts-ignore
      await statement.executeAsync(cat);
    }
    await statement.finalizeAsync();
  }
  
  return db;
}

export function getDatabase() {
  return SQLite.openDatabaseSync('vinyas.db');
}
