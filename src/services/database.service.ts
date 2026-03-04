import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import type { Category, VinyasDatabase } from '@/src/types';
import { createId, nowIso } from '@/src/utils/id';

const DB_VERSION = 1;
const WEB_STORAGE_KEY = 'vinyas_db_v1';
const DB_FILE_NAME = 'vinyas-db.json';

interface WebStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

const defaultCategories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Images',
    icon: 'image',
    gradient: ['#5B8FED', '#4A3BB0'],
    sortOrder: 0,
    isSystem: true,
    isKosh: false,
  },
  {
    name: 'Documents',
    icon: 'description',
    gradient: ['#E85D5D', '#8B1A1A'],
    sortOrder: 1,
    isSystem: true,
    isKosh: false,
  },
  {
    name: 'Videos',
    icon: 'videocam',
    gradient: ['#0F2027', '#2C5364'],
    sortOrder: 2,
    isSystem: true,
    isKosh: false,
  },
  {
    name: 'Audio',
    icon: 'music-note',
    gradient: ['#B721FF', '#4822DB'],
    sortOrder: 3,
    isSystem: true,
    isKosh: false,
  },
  {
    name: 'APKs',
    icon: 'android',
    gradient: ['#F59E0B', '#92400E'],
    sortOrder: 4,
    isSystem: true,
    isKosh: false,
  },
];

function cloneDb<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createSeedDatabase(): VinyasDatabase {
  const timestamp = nowIso();
  return {
    version: DB_VERSION,
    categories: defaultCategories.map((category) => ({
      ...category,
      id: createId('cat'),
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    ghostLinks: [],
    koshEntries: [],
    analyticsEvents: [],
    vault: {
      passcodeHash: null,
    },
    updatedAt: timestamp,
  };
}

function getDbPath(): string {
  const base = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
  return `${base}${DB_FILE_NAME}`;
}

let cache: VinyasDatabase | null = null;
let writeQueue: Promise<VinyasDatabase> = Promise.resolve(createSeedDatabase());

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    const storage = (globalThis as { localStorage?: WebStorage }).localStorage;
    return storage?.getItem(WEB_STORAGE_KEY) ?? null;
  }

  const dbPath = getDbPath();
  const info = await FileSystem.getInfoAsync(dbPath);
  if (!info.exists) {
    return null;
  }
  return FileSystem.readAsStringAsync(dbPath);
}

async function writeRaw(payload: string): Promise<void> {
  if (Platform.OS === 'web') {
    const storage = (globalThis as { localStorage?: WebStorage }).localStorage;
    storage?.setItem(WEB_STORAGE_KEY, payload);
    return;
  }

  const dbPath = getDbPath();
  await FileSystem.writeAsStringAsync(dbPath, payload);
}

async function loadDb(): Promise<VinyasDatabase> {
  if (cache) {
    return cloneDb(cache);
  }

  const raw = await readRaw();
  if (!raw) {
    const seeded = createSeedDatabase();
    await writeRaw(JSON.stringify(seeded));
    cache = seeded;
    return cloneDb(seeded);
  }

  const parsed = JSON.parse(raw) as Partial<VinyasDatabase>;
  const seeded = createSeedDatabase();
  const merged: VinyasDatabase = {
    ...seeded,
    ...parsed,
    version: DB_VERSION,
    categories: parsed.categories ?? seeded.categories,
    ghostLinks: parsed.ghostLinks ?? [],
    koshEntries: parsed.koshEntries ?? [],
    analyticsEvents: parsed.analyticsEvents ?? [],
    vault: {
      ...seeded.vault,
      ...(parsed.vault ?? {}),
    },
  };

  cache = merged;
  return cloneDb(merged);
}

async function persistDb(db: VinyasDatabase): Promise<VinyasDatabase> {
  const next = {
    ...db,
    updatedAt: nowIso(),
  };
  await writeRaw(JSON.stringify(next));
  cache = next;
  return cloneDb(next);
}

export async function initializeDatabase(): Promise<VinyasDatabase> {
  return loadDb();
}

export async function getDatabase(): Promise<VinyasDatabase> {
  return loadDb();
}

export async function updateDatabase(
  updater: (current: VinyasDatabase) => VinyasDatabase | Promise<VinyasDatabase>,
): Promise<VinyasDatabase> {
  writeQueue = writeQueue.then(async () => {
    const current = await loadDb();
    const updated = await updater(current);
    return persistDb(updated);
  });

  return writeQueue;
}

export async function resetDatabase(): Promise<VinyasDatabase> {
  const seeded = createSeedDatabase();
  await persistDb(seeded);
  return seeded;
}
