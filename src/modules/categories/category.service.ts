import { categoryRepository } from './category.repository.js';
import type { Category } from './category.types.js';

export const categoryService = {
  list(): Category[] {
    return categoryRepository.list();
  },

  isValidSlug(slug: string): boolean {
    if (slug === '') return true;
    return categoryRepository.exists(slug);
  },
};
