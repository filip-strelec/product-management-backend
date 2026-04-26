import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { categoryRoutes } from './modules/categories/category.routes.js';
import { productRoutes } from './modules/products/product.routes.js';
import { uploadRoutes } from './modules/uploads/upload.routes.js';
import { uploadDir } from './modules/uploads/upload.middleware.js';

export const createApp = (): express.Express => {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '1mb' }));
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/products', productRoutes);
  app.use('/categories', categoryRoutes);
  app.use('/uploads', uploadRoutes);
  // Static serving for uploaded thumbnails (read-only).
  app.use('/uploads', express.static(uploadDir, { fallthrough: true, index: false }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
