import type { Request, Response } from 'express';
import { productService } from './product.service.js';
import type {
  CreateProductInput,
  ProductSearchParams,
  UpdateProductInput,
} from './product.types.js';

export const productController = {
  search(req: Request, res: Response): void {
    const params = req.query as unknown as ProductSearchParams;
    res.json(productService.search(params));
  },

  getById(req: Request, res: Response): void {
    const { id } = req.params as unknown as { id: number };
    res.json(productService.getById(id));
  },

  create(req: Request, res: Response): void {
    const input = req.body as CreateProductInput;
    const created = productService.create(input);
    res.status(201).json(created);
  },

  update(req: Request, res: Response): void {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateProductInput;
    res.json(productService.update(id, input));
  },
};
