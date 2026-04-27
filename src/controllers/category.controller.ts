import { Router, type Request, type Response } from 'express';
import { categoryModel } from '../models/category.model.js';

const list = (_req: Request, res: Response): void => {
  res.json(categoryModel.list());
};

export const categoryRouter = Router();

categoryRouter.get('/', list);
