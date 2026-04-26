import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';

type Source = 'body' | 'query' | 'params';

export const validate =
  <T extends ZodTypeAny>(schema: T, source: Source = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Replace the source with the parsed (and coerced) value so downstream
    // handlers get a strongly typed object.
    (req as unknown as Record<Source, z.infer<T>>)[source] = result.data;
    next();
  };
