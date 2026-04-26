import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { productController } from './product.controller.js';
import {
  createProductSchema,
  productIdParamSchema,
  searchQuerySchema,
  updateProductSchema,
} from './product.schema.js';

export const productRoutes = Router();

productRoutes.get('/search', validate(searchQuerySchema, 'query'), productController.search);
productRoutes.post('/add', validate(createProductSchema, 'body'), productController.create);
productRoutes.get('/:id', validate(productIdParamSchema, 'params'), productController.getById);
productRoutes.put(
  '/:id',
  validate(productIdParamSchema, 'params'),
  validate(updateProductSchema, 'body'),
  productController.update,
);
