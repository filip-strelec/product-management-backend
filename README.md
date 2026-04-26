# Product Management – Backend (Node.js + Express + TypeScript)

REST API for the Product Management take-home task.

## Stack

- **Node.js 20+** with **TypeScript** (strict mode, NodeNext modules)
- **Express 4** — minimal, well-understood HTTP framework
- **better-sqlite3** — synchronous, file-based SQL database (zero ops, perfect for a take-home)
- **Zod** — declarative validation for request `body` / `query` / `params`
- **morgan**, **cors**, **dotenv** for logging, CORS, and config

## Setup

```bash
cd backend
cp .env.example .env       # adjust if needed
npm install
npm run seed               # one-off: populates SQLite from DummyJSON (~100 products)
npm run dev                # starts API on http://localhost:3000 with hot reload
```

Other scripts:

| Script           | Purpose                                          |
| ---------------- | ------------------------------------------------ |
| `npm run build`  | Type-check and compile to `dist/`                |
| `npm start`      | Run the compiled build (`node dist/index.js`)    |
| `npm run typecheck` | `tsc --noEmit`                                |

## Environment variables

All vars are validated at boot via Zod (see `src/config/env.ts`).

| Variable               | Default                | Purpose                                                                        |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| `PORT`                 | `3000`                 | HTTP listen port                                                               |
| `NODE_ENV`             | `development`          | `development` \| `production` \| `test`                                        |
| `DATABASE_FILE`        | `./data/products.db`   | SQLite file path (created on first run)                                        |
| `CORS_ORIGIN`          | `http://localhost:4200`| Allowed origin for the API                                                     |
| `SEED_CATEGORIES_FILE` | *(unset)*              | Optional JSON path. When set, seeds categories from disk instead of DummyJSON. |
| `SEED_PRODUCTS_FILE`   | *(unset)*              | Optional JSON path. When set, seeds products from disk instead of DummyJSON.   |
| `UPLOAD_DIR`           | `./data/uploads`       | Directory where uploaded thumbnails are written (auto-created)                 |
| `MAX_UPLOAD_BYTES`     | `1048576` (1 MiB)      | Per-file size cap enforced by multer                                           |

### Custom seed data

Set `SEED_PRODUCTS_FILE` and/or `SEED_CATEGORIES_FILE` in your `.env` to load
seed data from local JSON files instead of fetching DummyJSON. Example fixtures
and the file format reference live in [`src/db/seedValues/README.md`](./src/db/seedValues/README.md).

The seed runner is **idempotent** — it only inserts when the target table is
empty. To re-seed, delete the SQLite file (`rm data/products.db`) and restart.

### Thumbnail uploads

Thumbnails are saved as files under `UPLOAD_DIR` and served back as static
assets at `/uploads/<filename>`. The product's `thumbnail` column stores the
absolute URL returned by the upload endpoint, so the frontend can use it
directly in `<img src>`.

- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Per-file cap: `MAX_UPLOAD_BYTES` (default **1 MiB**)
- The frontend additionally validates the file before uploading (same caps,
  kept in sync via constants in `frontend/src/app/core/services/upload.service.ts`).

> Production note: when the API sits behind a reverse proxy under a sub-path
> (e.g. `/api`), either rewrite the returned URL or have the proxy expose
> `/uploads` directly. For this take-home both backend and frontend run on
> their own ports and absolute URLs work out of the box.

## API

Base URL: `http://localhost:3000`

| Method | Path                  | Description                                  |
| ------ | --------------------- | -------------------------------------------- |
| GET    | `/health`             | Liveness probe                               |
| GET    | `/products/search`    | Paginated, sortable, searchable list         |
| GET    | `/products/:id`       | Single product                               |
| POST   | `/products/add`       | Create a product                             |
| PUT    | `/products/:id`       | Update a product (partial body allowed)      |
| GET    | `/categories`         | List of `{ slug, name }` lookup values       |
| POST   | `/uploads/thumbnail`  | Multipart upload (`file` field) → `{ url }`  |
| GET    | `/uploads/:filename`  | Serve an uploaded thumbnail                  |

### `GET /products/search` query parameters

| Param    | Type   | Default | Notes                                       |
| -------- | ------ | ------- | ------------------------------------------- |
| `q`      | string | `''`    | Filters by `title` or `description` (LIKE)  |
| `limit`  | number | `30`    | 1–100                                       |
| `skip`   | number | `0`     | Offset                                      |
| `sortBy` | enum   | `id`    | `id` \| `title` \| `price` \| `category`    |
| `order`  | enum   | `asc`   | `asc` \| `desc`                             |

Response shape:

```json
{ "items": [ /* Product[] */ ], "total": 100, "limit": 30, "skip": 0 }
```

### Product shape

```ts
interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  thumbnail: string;
  tags: string[];
}
```

## Architecture

```text
src/
├── index.ts                    # process entry point
├── app.ts                      # express app factory (testable)
├── config/env.ts               # zod-validated env vars
├── db/
│   ├── database.ts             # sqlite connection + schema bootstrap
│   ├── seed.ts                 # CLI entry point for `npm run seed`
│   ├── seed-runner.ts          # idempotent boot-time seeder
│   ├── fallback-categories.ts  # offline category list
│   └── seedValues/             # optional local seed JSON (see folder README)
├── middleware/
│   ├── async-handler.ts        # forwards async errors to next()
│   ├── error-handler.ts        # central error + 404 handler
│   └── validate.ts             # generic zod request validator
├── modules/
│   ├── products/
│   │   ├── product.routes.ts       # URL → controller
│   │   ├── product.controller.ts   # request/response only
│   │   ├── product.service.ts      # business rules
│   │   ├── product.repository.ts   # the only place that touches the db
│   │   ├── product.schema.ts       # zod schemas
│   │   └── product.types.ts        # Product, inputs, db row
│   ├── categories/                 # /categories lookup (slug → name)
│   └── uploads/
│       ├── upload.middleware.ts    # multer config (disk storage + limits)
│       └── upload.routes.ts        # POST /uploads/thumbnail
└── utils/http-error.ts         # typed HTTP errors
```

**Layering rule:** routes → controller → service → repository → db. A layer
may only depend on the one directly below it.

## Key decisions

- **SQLite via better-sqlite3** — single-file DB, no Docker, fully synchronous
  API which makes the repository code dead simple. Matches the brief's
  "stored in the database" requirement without adding ops.
- **Zod-everywhere validation** — every request is parsed and coerced before
  the controller runs, so controllers/services see strongly typed input.
- **Schema-bootstrap, not migrations** — `CREATE TABLE IF NOT EXISTS` is enough
  for one entity; a real project would use `node-pg-migrate` / Prisma migrate.
- **Tags as a JSON column** — fine for read/write of the whole product; if
  per-tag querying mattered we'd extract a `product_tags` table.
- **Standalone app factory** (`createApp`) — keeps the listener separate from
  the app, so it can be imported by tests without binding to a port.


