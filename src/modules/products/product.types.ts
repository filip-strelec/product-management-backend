export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  thumbnail: string;
  tags: string[];
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

export type CreateProductInput = Omit<Product, 'id'>;
export type UpdateProductInput = Partial<CreateProductInput>;

/** Raw row shape as stored in SQLite (tags is a JSON string). */
export interface ProductRow {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  thumbnail: string;
  tags: string;
}
