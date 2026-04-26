import { db } from '../../db/database.js';
import type {
  CreateProductInput,
  Product,
  ProductRow,
  ProductSearchParams,
  ProductSearchResult,
  UpdateProductInput,
} from './product.types.js';

const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  price: row.price,
  thumbnail: row.thumbnail,
  tags: JSON.parse(row.tags) as string[],
});

export const productRepository = {
  search(params: ProductSearchParams): ProductSearchResult {
    const { q, limit, skip, sortBy, order } = params;

    // sortBy/order are validated against an allow-list, so it is safe to inline.
    const orderClause = `ORDER BY ${sortBy} ${order.toUpperCase()}`;
    const whereClause = q ? 'WHERE title LIKE @like OR description LIKE @like' : '';
    const bindings: { like: string; limit: number; skip: number } = {
      like: `%${q}%`,
      limit,
      skip,
    };

    const rows = db
      .prepare<typeof bindings, ProductRow>(
        `SELECT id, title, description, category, price, thumbnail, tags
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
        `SELECT id, title, description, category, price, thumbnail, tags
         FROM products WHERE id = @id`,
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

    const created = this.findById(Number(result.lastInsertRowid));
    if (!created) throw new Error('Failed to load created product');
    return created;
  },

  update(id: number, input: UpdateProductInput): Product | null {
    const existing = this.findById(id);
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

    return this.findById(id);
  },
};
