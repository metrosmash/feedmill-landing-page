# Feedmill Farms — storefront concept demo

A frontend-first demo of a farm-produce storefront, built under the neutral
**Feedmill Farms** brand. It is an independent concept demo and is **not
affiliated with any business**. All prices, contact details, and bank details
are placeholders.

The demo is plain HTML, CSS, and ES modules. There is no build step for the
app.

## Run it

From the repo root:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. The demo also works on a phone on the same
network.

## Tests

Tests are a development-only dependency; the shipped app does not use them.

```sh
npm install
npm test
```

The suite covers the `Api` contract for the public read path, the storefront
grid, the shell settings wiring, and the static page shell.

## What is built so far

- Neutral storefront shell: header, hero, trust strip, product grid, footer,
  `noindex`, and the "independent concept demo" notice.
- Five seeded products: Turkey, Broiler Chicken, Garri, 3L Palm Oil, and 5L
  Palm Oil. Garri is seeded sold out.
- Versioned seed settings for brand, contact, bank, delivery, and digest.
- A single `Api` adapter with a `MockApi` implementation backed by
  `localStorage`, plus the documented future HTTP contract in
  [`docs/api-contract.md`](docs/api-contract.md).
- Temporary SVG placeholders for Turkey and both palm oils. Licensed stock
  photos and credits arrive in the final packaging ticket.

## Demo data

`MockApi` persists to `feedmill:v1:products` and `feedmill:v1:settings` in the
current browser. A missing, corrupt, or version-mismatched payload is reseeded
from `js/data/seed.js`. Later tickets add orders, admin, exports, digest, and
reset.

## Roadmap

The implementation issues live under
[`.scratch/assetrise-storefront/issues/`](.scratch/assetrise-storefront/issues/).
The owner CMS, checkout, orders, exports, settings editing, digest preview, and
demo reset arrive in tickets 03–10.
