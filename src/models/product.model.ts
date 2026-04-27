import { z } from 'zod';
import { db } from '../db/database.js';

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  thumbnail: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductSearchResult {
  items: Product[];
  total: number;
  limit: number;
  skip: number;
}

export interface ProductSearchParams {
  q: string;
  limit: number;
  skip: number;
  sortBy: 'id' | 'title' | 'price' | 'category';
  order: 'asc' | 'desc';
}

export type CreateProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductInput = Partial<CreateProductInput>;

/** Raw row shape as stored in SQLite (tags is a JSON string). */
interface ProductRow {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  thumbnail: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

/** Escapes SQL LIKE special characters so user input never expands wildcards. */
const escapeLike = (value: string): string =>
  value.replace(/[\\%_]/g, (ch) => `\\${ch}`);

export const productIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().default(''),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  skip: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['id', 'title', 'price', 'category']).default('id'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const createProductSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).default(''),
  category: z.string().trim().max(100).default(''),
  price: z.number().positive('Price must be greater than 0'),
  thumbnail: z.string().trim().url().or(z.literal('')).default(''),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
});

export const updateProductSchema = createProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);

const PRODUCT_COLUMNS =
  'id, title, description, category, price, thumbnail, tags, created_at, updated_at';

const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  price: row.price,
  thumbnail: row.thumbnail,
  tags: JSON.parse(row.tags) as string[],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const productModel = {
  search(params: ProductSearchParams): ProductSearchResult {
    const { q, limit, skip, sortBy, order } = params;

    // sortBy/order are validated against an allow-list, so it is safe to inline.
    const orderClause = `ORDER BY ${sortBy} ${order.toUpperCase()}`;
    // `ESCAPE '\'` lets users literally search for `%`/`_` without expanding
    // them as LIKE wildcards (escapeLike prefixes them with a backslash).
    const whereClause = q
      ? `WHERE title LIKE @like ESCAPE '\\' OR description LIKE @like ESCAPE '\\'`
      : '';
    const bindings: { like: string; limit: number; skip: number } = {
      like: `%${escapeLike(q)}%`,
      limit,
      skip,
    };

    const rows = db
      .prepare<typeof bindings, ProductRow>(
        `SELECT ${PRODUCT_COLUMNS}
         FROM products
         ${whereClause}
         ${orderClause}
         LIMIT @limit OFFSET @skip`,
      )
      .all(bindings);

    const totalRow = db
      .prepare<typeof bindings, { c: number }>(
        `SELECT COUNT(*) AS c FROM products ${whereClause}`,
      )
      .get(bindings);

    return {
      items: rows.map(toProduct),
      total: totalRow?.c ?? 0,
      limit,
      skip,
    };
  },

  findById(id: number): Product | null {
    const row = db
      .prepare<{ id: number }, ProductRow>(
        `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = @id`,
      )
      .get({ id });
    return row ? toProduct(row) : null;
  },

  create(input: CreateProductInput): Product {
    const result = db
      .prepare(
        `INSERT INTO products (title, description, category, price, thumbnail, tags)
         VALUES (@title, @description, @category, @price, @thumbnail, @tags)`,
      )
      .run({
        title: input.title,
        description: input.description,
        category: input.category,
        price: input.price,
        thumbnail: input.thumbnail,
        tags: JSON.stringify(input.tags),
      });

    const created = productModel.findById(Number(result.lastInsertRowid));
    if (!created) throw new Error('Failed to load created product');
    return created;
  },

  update(id: number, input: UpdateProductInput): Product | null {
    const existing = productModel.findById(id);
    if (!existing) return null;

    const merged: Product = { ...existing, ...input };
    db.prepare(
      `UPDATE products
       SET title = @title,
           description = @description,
           category = @category,
           price = @price,
           thumbnail = @thumbnail,
           tags = @tags,
           updated_at = datetime('now')
       WHERE id = @id`,
    ).run({
      id,
      title: merged.title,
      description: merged.description,
      category: merged.category,
      price: merged.price,
      thumbnail: merged.thumbnail,
      tags: JSON.stringify(merged.tags),
    });

    return productModel.findById(id);
  },
};
