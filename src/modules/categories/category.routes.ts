import { Router, type Request, type Response } from 'express';
import { categoryService } from './category.service.js';

export const categoryRoutes = Router();

categoryRoutes.get('/', (_req: Request, res: Response) => {
  res.json(categoryService.list());
});
