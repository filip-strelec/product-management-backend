# Custom seed data

Drop-in JSON files used by the seed runner instead of fetching DummyJSON.

## How it works

On every API boot, `runSeed()` checks whether the `categories` and `products`
tables are empty. If they are, it picks a source based on the
`SEED_FROM_LOCAL_FILES` env var:

1. **Local files** — when `SEED_FROM_LOCAL_FILES=true`, the runner reads
   `seedCategories.json` and `seedProducts.json` from this folder.
2. **DummyJSON** — otherwise (the default), over the network (`https://dummyjson.com`).
3. **Hard-coded fallback** *(categories only)* — used when the chosen source
   fails so the UI always has a usable lookup list.

If the tables already contain rows, the runner does nothing — it is idempotent.

## Enabling local seed

Set the flag in `backend/.env`:

```ini
SEED_FROM_LOCAL_FILES=true
```

The file paths are fixed (`src/db/seedValues/seedCategories.json` and
`seedProducts.json`, resolved from `backend/` — the working directory at boot).
Edit those JSON files in place to change the seeded dataset; both are loaded
when the flag is on.

After changing seed data you must reset the database for it to take effect
(the runner skips populated tables):

```bash
rm -rf data/products.db   # macOS / Linux
del data\products.db      # Windows PowerShell (use `Remove-Item`)
npm run dev               # next boot reseeds from the configured source
```

## File formats

### `seedCategories.json`

Array of `{ slug, name }` objects. The `slug` is the value stored on each
product (`product.category`), the `name` is what the UI displays.

```json
[
  { "slug": "beauty", "name": "Beauty" },
  { "slug": "laptops", "name": "Laptops" }
]
```

Validation: every entry must have a non-empty `slug` and `name`. The runner
throws on the first malformed entry and falls back to the hard-coded list.

### `seedProducts.json`

Array of product objects. Only `title` is required; everything else is
optional with sane defaults.

```json
[
  {
    "title": "Apple MacBook Pro 14",
    "description": "M3-powered Pro laptop.",
    "category": "laptops",
    "price": 1999,
    "thumbnail": "https://cdn.dummyjson.com/products/images/laptops/.../thumbnail.png",
    "tags": ["laptop", "apple"]
  }
]
```

| Field         | Type       | Required | Default |
| ------------- | ---------- | -------- | ------- |
| `title`       | `string`   | yes      | —       |
| `description` | `string`   | no       | `''`    |
| `category`    | `string`   | no       | `''`    |
| `price`       | `number`   | no       | `0`     |
| `thumbnail`   | `string`   | no       | `''`    |
| `tags`        | `string[]` | no       | `[]`    |

> The `category` value should match a `slug` from `seedCategories.json`
> (or a slug from DummyJSON when categories are seeded remotely). The API
> rejects unknown slugs at create/update time.

## Tips

- Keep these files small for development; large seed sets slow boot.
- Commit the example files; commit your **own** seed only if it does not
  contain sensitive data.
- The provided `seedProducts.json` and `seedCategories.json` in this folder
  are tiny on-purpose — replace them with your real fixtures.
