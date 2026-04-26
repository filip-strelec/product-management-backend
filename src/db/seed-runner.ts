/**
 * Idempotent seed runner — safe to call on every boot.
 *
 * Source resolution:
 *  - If `SEED_CATEGORIES_FILE` / `SEED_PRODUCTS_FILE` env vars are set, the
 *    runner reads those JSON files from disk.
 *  - Otherwise it fetches DummyJSON over the network.
 *  - If categories cannot be fetched, a hard-coded fallback is used so the
 *    UI still has a usable lookup. Product seed failures are swallowed so
 *    the API can still start (the user can re-run `npm run seed` later).
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { env } from '../config/env.js';
import { db } from './database.js';
import { FALLBACK_CATEGORIES } from './fallback-categories.js';
import { categoryRepository } from '../modules/categories/category.repository.js';
import type { Category } from '../modules/categories/category.types.js';
import type { CreateProductInput } from '../modules/products/product.types.js';

interface DummyJsonProduct {
  id: number;
  title: string;
  description?: string;
  category?: string;
  price?: number;
  thumbnail?: string;
  tags?: string[];
}

const PRODUCTS_URL = 'https://dummyjson.com/products?limit=100';
const CATEGORIES_URL = 'https://dummyjson.com/products/categories';

const readJsonFile = async <T>(relPath: string): Promise<T> => {
  const absPath = resolve(process.cwd(), relPath);
  const raw = await readFile(absPath, 'utf-8');
  return JSON.parse(raw) as T;
};

const productCount = (): number => {
  const row = db.prepare<[], { c: number }>('SELECT COUNT(*) AS c FROM products').get();
  return row?.c ?? 0;
};

const insertProductStmt = db.prepare(
  `INSERT INTO products (title, description, category, price, thumbnail, tags)
   VALUES (@title, @description, @category, @price, @thumbnail, @tags)`,
);

const insertProducts = db.transaction((products: CreateProductInput[]) => {
  for (const p of products) {
    insertProductStmt.run({ ...p, tags: JSON.stringify(p.tags) });
  }
});

const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch(CATEGORIES_URL);
  if (!res.ok) throw new Error(`Categories request failed: ${res.status}`);
  const data = (await res.json()) as Array<{ slug: string; name: string }>;
  return data.map((c) => ({ slug: c.slug, name: c.name }));
};

const fetchProducts = async (): Promise<CreateProductInput[]> => {
  const res = await fetch(PRODUCTS_URL);
  if (!res.ok) throw new Error(`Products request failed: ${res.status}`);
  const data = (await res.json()) as { products: DummyJsonProduct[] };
  return data.products.map((p) => ({
    title: p.title,
    description: p.description ?? '',
    category: p.category ?? '',
    price: p.price ?? 0,
    thumbnail: p.thumbnail ?? '',
    tags: p.tags ?? [],
  }));
};

const loadCategoriesFromFile = async (path: string): Promise<Category[]> => {
  const data = await readJsonFile<unknown>(path);
  if (!Array.isArray(data)) throw new Error('Expected a JSON array of categories');
  return data.map((entry, idx) => {
    const c = entry as Partial<Category>;
    if (!c.slug || !c.name) {
      throw new Error(`Category at index ${idx} is missing "slug" or "name"`);
    }
    return { slug: c.slug, name: c.name };
  });
};

const loadProductsFromFile = async (path: string): Promise<CreateProductInput[]> => {
  const data = await readJsonFile<unknown>(path);
  if (!Array.isArray(data)) throw new Error('Expected a JSON array of products');
  return data.map((entry, idx) => {
    const p = entry as Partial<CreateProductInput>;
    if (!p.title) throw new Error(`Product at index ${idx} is missing "title"`);
    return {
      title: p.title,
      description: p.description ?? '',
      category: p.category ?? '',
      price: typeof p.price === 'number' ? p.price : 0,
      thumbnail: p.thumbnail ?? '',
      tags: Array.isArray(p.tags) ? p.tags : [],
    };
  });
};

const seedCategories = async (log: (msg: string) => void): Promise<void> => {
  if (categoryRepository.count() > 0) return;

  if (env.SEED_CATEGORIES_FILE) {
    try {
      const local = await loadCategoriesFromFile(env.SEED_CATEGORIES_FILE);
      categoryRepository.bulkInsert(local);
      log(`Seeded ${local.length} categories from ${env.SEED_CATEGORIES_FILE}.`);
      return;
    } catch (err) {
      log(`Local category seed failed (${(err as Error).message}); using fallback list.`);
      categoryRepository.bulkInsert(FALLBACK_CATEGORIES);
      return;
    }
  }

  try {
    const remote = await fetchCategories();
    categoryRepository.bulkInsert(remote);
    log(`Seeded ${remote.length} categories from DummyJSON.`);
  } catch (err) {
    categoryRepository.bulkInsert(FALLBACK_CATEGORIES);
    log(
      `Seeded ${FALLBACK_CATEGORIES.length} categories from local fallback ` +
        `(DummyJSON unreachable: ${(err as Error).message}).`,
    );
  }
};

const seedProducts = async (log: (msg: string) => void): Promise<void> => {
  if (productCount() > 0) return;

  if (env.SEED_PRODUCTS_FILE) {
    try {
      const local = await loadProductsFromFile(env.SEED_PRODUCTS_FILE);
      insertProducts(local);
      log(`Seeded ${local.length} products from ${env.SEED_PRODUCTS_FILE}.`);
      return;
    } catch (err) {
      log(`Skipped product seed (local file unreadable: ${(err as Error).message}).`);
      return;
    }
  }

  try {
    const products = await fetchProducts();
    insertProducts(products);
    log(`Seeded ${products.length} products from DummyJSON.`);
  } catch (err) {
    log(`Skipped product seed (DummyJSON unreachable: ${(err as Error).message}).`);
  }
};

export const runSeed = async (
  options: { silent?: boolean } = {},
): Promise<void> => {
  const log = options.silent ? () => {} : (msg: string) => console.log(`[seed] ${msg}`);
  await seedCategories(log);
  await seedProducts(log);
};
