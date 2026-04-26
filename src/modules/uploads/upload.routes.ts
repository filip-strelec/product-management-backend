import { Router, type ErrorRequestHandler, type RequestHandler } from 'express';
import multer from 'multer';
import { env } from '../../config/env.js';
import { HttpError } from '../../utils/http-error.js';
import { thumbnailUpload } from './upload.middleware.js';

export const uploadRoutes = Router();

/**
 * Translates multer's own errors (size limit, unexpected field, …) into the
 * project's `HttpError` so the central error handler can format them.
 */
const handleMulterError: ErrorRequestHandler = (err, _req, _res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxKb = Math.round(env.MAX_UPLOAD_BYTES / 1024);
      next(new HttpError(400, `File is too large (max ${maxKb} KB).`));
      return;
    }
    next(new HttpError(400, err.message));
    return;
  }
  next(err);
};

const respondWithUrl: RequestHandler = (req, res) => {
  if (!req.file) {
    throw new HttpError(400, 'No file received. Use multipart field name "file".');
  }
  // Build an absolute URL so the frontend can use it directly in <img src>.
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.status(201).json({
    url: `${baseUrl}/uploads/${req.file.filename}`,
    filename: req.file.filename,
    size: req.file.size,
    mimeType: req.file.mimetype,
  });
};

uploadRoutes.post('/thumbnail', thumbnailUpload, handleMulterError, respondWithUrl);
