import { Router, type Request, type Response } from 'express';
import { validate } from '../middleware/validate.js';
import { categoryModel } from '../models/category.model.js';
import {
  createProductSchema,
  productIdParamSchema,
  productModel,
  searchQuerySchema,
  updateProductSchema,
  type CreateProductInput,
  type ProductSearchParams,
  type UpdateProductInput,
} from '../models/product.model.js';
import { HttpError } from '../utils/http-error.js';

const assertCategoryExists = (category: string | undefined): void => {
  if (category === undefined) return;
  if (!categoryModel.isValidSlug(category)) {
    throw HttpError.badRequest('Validation failed', {
      fieldErrors: { category: [`Unknown category "${category}"`] },
    });
  }
};

const search = (req: Request, res: Response): void => {
  const params = req.query as unknown as ProductSearchParams;
  res.json(productModel.search(params));
};

const getById = (req: Request, res: Response): void => {
  const { id } = req.params as unknown as { id: number };
  const product = productModel.findById(id);
  if (!product) throw HttpError.notFound(`Product ${id} not found`);
  res.json(product);
};

const create = (req: Request, res: Response): void => {
  const input = req.body as CreateProductInput;
  assertCategoryExists(input.category);
  res.status(201).json(productModel.create(input));
};

const update = (req: Request, res: Response): void => {
  const { id } = req.params as unknown as { id: number };
  const input = req.body as UpdateProductInput;
  assertCategoryExists(input.category);
  const updated = productModel.update(id, input);
  if (!updated) throw HttpError.notFound(`Product ${id} not found`);
  res.json(updated);
};

export const productRouter = Router();

productRouter.get('/search', validate(searchQuerySchema, 'query'), search);
productRouter.post('/add', validate(createProductSchema, 'body'), create);
productRouter.get('/:id', validate(productIdParamSchema, 'params'), getById);
productRouter.put(
  '/:id',
  validate(productIdParamSchema, 'params'),
  validate(updateProductSchema, 'body'),
  update,
);
