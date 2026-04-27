import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { env } from './config/env.js';
import { categoryRouter } from './controllers/category.controller.js';
import { productRouter } from './controllers/product.controller.js';
import { uploadDir, uploadRouter } from './controllers/upload.controller.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

export const createApp = (): express.Express => {
  const app = express();

  if (env.TRUST_PROXY) app.set('trust proxy', true);
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '1mb' }));
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/products', productRouter);
  app.use('/categories', categoryRouter);
  app.use('/uploads', uploadRouter);
  // Static serving for uploaded thumbnails (read-only).
  app.use('/uploads', express.static(uploadDir, { fallthrough: true, index: false }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
