import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import {
  Router,
  type ErrorRequestHandler,
  type Request,
  type Response,
} from 'express';
import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
const ALLOWED_MIME = new Set<string>(ALLOWED_MIME_TYPES);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

/** Absolute upload directory; created on first import. */
export const uploadDir = resolve(process.cwd(), env.UPLOAD_DIR);
mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXT.has(ext) ? ext : '';
    cb(null, `${Date.now()}-${randomBytes(8).toString('hex')}${safeExt}`);
  },
});

const thumbnailUpload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new HttpError(400, `Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
}).single('file');

/**
 * Translates multer's own errors (size limit, unexpected field, ...) into the
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

const respondWithUrl = (req: Request, res: Response): void => {
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

export const uploadRouter = Router();

uploadRouter.get('/config', (_req, res) => {
  res.json({
    maxBytes: env.MAX_UPLOAD_BYTES,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
  });
});

uploadRouter.post('/thumbnail', thumbnailUpload, handleMulterError, respondWithUrl);
