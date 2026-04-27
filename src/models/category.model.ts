import { db } from '../db/database.js';

export interface Category {
  slug: string;
  name: string;
}

const insertStmt = db.prepare<Category>(
  `INSERT OR IGNORE INTO categories (slug, name) VALUES (@slug, @name)`,
);

const insertMany = db.transaction((rows: Category[]) => {
  for (const row of rows) insertStmt.run(row);
});

export const categoryModel = {
  list(): Category[] {
    return db
      .prepare<[], Category>('SELECT slug, name FROM categories ORDER BY name ASC')
      .all();
  },

  count(): number {
    const row = db.prepare<[], { c: number }>('SELECT COUNT(*) AS c FROM categories').get();
    return row?.c ?? 0;
  },

  exists(slug: string): boolean {
    const row = db
      .prepare<{ slug: string }, { slug: string }>(
        'SELECT slug FROM categories WHERE slug = @slug',
      )
      .get({ slug });
    return Boolean(row);
  },

  bulkInsert(rows: Category[]): void {
    if (rows.length === 0) return;
    insertMany(rows);
  },

  isValidSlug(slug: string): boolean {
    if (slug === '') return true;
    return categoryModel.exists(slug);
  },
};
