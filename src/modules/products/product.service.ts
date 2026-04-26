import { HttpError } from '../../utils/http-error.js';
import { categoryService } from '../categories/category.service.js';
import { productRepository } from './product.repository.js';
import type {
  CreateProductInput,
  Product,
  ProductSearchParams,
  ProductSearchResult,
  UpdateProductInput,
} from './product.types.js';

const assertCategoryExists = (category: string | undefined): void => {
  if (category === undefined) return;
  if (!categoryService.isValidSlug(category)) {
    throw HttpError.badRequest('Validation failed', {
      fieldErrors: { category: [`Unknown category "${category}"`] },
    });
  }
};

export const productService = {
  search(params: ProductSearchParams): ProductSearchResult {
    return productRepository.search(params);
  },

  getById(id: number): Product {
    const product = productRepository.findById(id);
    if (!product) throw HttpError.notFound(`Product ${id} not found`);
    return product;
  },

  create(input: CreateProductInput): Product {
    assertCategoryExists(input.category);
    return productRepository.create(input);
  },

  update(id: number, input: UpdateProductInput): Product {
    assertCategoryExists(input.category);
    const updated = productRepository.update(id, input);
    if (!updated) throw HttpError.notFound(`Product ${id} not found`);
    return updated;
  },
};
