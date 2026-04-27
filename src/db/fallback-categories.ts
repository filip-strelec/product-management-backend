import type { Category } from '../models/category.model.js';

/**
 * Mirror of DummyJSON's category list, used when the network is unreachable
 * during initial seed so the app still has a usable lookup. (Only when not seeding from local files!)
 * TODO: a bit of redundant/overEngineered IMO, as we have seeding from local files logic already
 * 
 */
export const FALLBACK_CATEGORIES: Category[] = [
  { slug: 'beauty',               name: 'Beauty' },
  { slug: 'fragrances',           name: 'Fragrances' },
  { slug: 'furniture',            name: 'Furniture' },
  { slug: 'groceries',            name: 'Groceries' },
  { slug: 'home-decoration',      name: 'Home Decoration' },
  { slug: 'kitchen-accessories',  name: 'Kitchen Accessories' },
  { slug: 'laptops',              name: 'Laptops' },
  { slug: 'mens-shirts',          name: "Men's Shirts" },
  { slug: 'mens-shoes',           name: "Men's Shoes" },
  { slug: 'mens-watches',         name: "Men's Watches" },
  { slug: 'mobile-accessories',   name: 'Mobile Accessories' },
  { slug: 'motorcycle',           name: 'Motorcycle' },
  { slug: 'skin-care',            name: 'Skin Care' },
  { slug: 'smartphones',          name: 'Smartphones' },
  { slug: 'sports-accessories',   name: 'Sports Accessories' },
  { slug: 'sunglasses',           name: 'Sunglasses' },
  { slug: 'tablets',              name: 'Tablets' },
  { slug: 'tops',                 name: 'Tops' },
  { slug: 'vehicle',              name: 'Vehicle' },
  { slug: 'womens-bags',          name: "Women's Bags" },
  { slug: 'womens-dresses',       name: "Women's Dresses" },
  { slug: 'womens-jewellery',     name: "Women's Jewellery" },
  { slug: 'womens-shoes',         name: "Women's Shoes" },
  { slug: 'womens-watches',       name: "Women's Watches" },
];
