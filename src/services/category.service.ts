import type { Category } from '@/src/types';
import { getDatabase, updateDatabase } from '@/src/services/database.service';
import { recordEvent } from '@/src/services/analytics.service';
import { createId, nowIso } from '@/src/utils/id';

const FALLBACK_GRADIENTS: [string, string][] = [
  ['#D97B3C', '#C4602A'],
  ['#5DADE2', '#1D2B53'],
  ['#2ED573', '#0B8F4C'],
  ['#F59E0B', '#92400E'],
  ['#9C27B0', '#4A148C'],
];

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  return [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createCategory(name: string): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Category name is required.');
  }

  const existingCategories = await getAllCategories();
  const lowerName = trimmed.toLowerCase();
  if (existingCategories.some((category) => category.name.toLowerCase() === lowerName)) {
    throw new Error('Category name already exists.');
  }

  const now = nowIso();
  const gradient = FALLBACK_GRADIENTS[existingCategories.length % FALLBACK_GRADIENTS.length];
  const newCategory: Category = {
    id: createId('cat'),
    name: trimmed,
    icon: 'folder',
    gradient,
    sortOrder: existingCategories.length,
    isSystem: false,
    isKosh: false,
    createdAt: now,
    updatedAt: now,
  };

  await updateDatabase((db) => ({
    ...db,
    categories: [...db.categories, newCategory],
  }));

  await recordEvent('search', { metadata: `category_created:${newCategory.id}` });
  return newCategory;
}

export async function renameCategory(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Category name is required.');
  }

  await updateDatabase((db) => ({
    ...db,
    categories: db.categories.map((category) =>
      category.id === id
        ? {
            ...category,
            name: trimmed,
            updatedAt: nowIso(),
          }
        : category,
    ),
  }));
}

export async function deleteCategory(id: string): Promise<void> {
  await updateDatabase((db) => ({
    ...db,
    categories: db.categories
      .filter((category) => category.id !== id)
      .map((category, index) => ({
        ...category,
        sortOrder: index,
      })),
    ghostLinks: db.ghostLinks.filter((link) => link.categoryId !== id),
    koshEntries: db.koshEntries.filter((entry) =>
      db.ghostLinks.some((link) => link.id === entry.ghostLinkId && link.categoryId !== id),
    ),
  }));
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
  await updateDatabase((db) => ({
    ...db,
    categories: db.categories.map((category) => ({
      ...category,
      sortOrder: orderMap.get(category.id) ?? category.sortOrder,
      updatedAt: nowIso(),
    })),
  }));
}
