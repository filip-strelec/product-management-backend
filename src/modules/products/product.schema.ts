import { z } from 'zod';

export const productIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().default(''),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  skip: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['id', 'title', 'price', 'category']).default('id'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const createProductSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).default(''),
  category: z.string().trim().max(100).default(''),
  price: z.number().positive('Price must be greater than 0'),
  thumbnail: z.string().trim().url().or(z.literal('')).default(''),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
});

export const updateProductSchema = createProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);
