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

## Demo walkthrough

**Customer** (`index.html`): browse the five seeded products (Garri starts
sold out), set quantities with the steppers, pick pickup or delivery in the
live order summary, fill the checkout form, and submit. The confirmation shows
the order number, bank-transfer details, a WhatsApp button with a prefilled
message, and pickup/delivery next steps. Refreshing re-shows the last
confirmation.

**Owner** (`admin.html` → CMS link in the header): sign in with the demo
password `feedmill2026` (demo-only, session-scoped — not real security).
Manage products (add, edit, delete, sold-out toggle, image preview), review
orders in the spreadsheet-style table with a detail view, download JSON/CSV
exports, preview and send the daily digest (demo-only, no email is sent), edit
settings, and reset the demo.

**Reset the demo**: Settings tab → “Reset demo data” (with confirmation).
Orders are cleared and products/settings return to the seed. Garri is sold out
again. Reset only touches `feedmill:`-namespaced keys; nothing else in the
browser is affected.

## Tests

Tests are a development-only dependency; the shipped app does not use them.

```sh
npm install
npm test
```

The suite runs the `Api` contract against `MockApi` (products, settings,
orders, exports, digest, reset), validation rules, and storefront/admin UI
flows in jsdom. Manually verify the full customer and admin flows end to end
at a phone-sized viewport before a pitch; the main flows should produce no
console errors.

## Demo data and storage

`MockApi` persists versioned slices to `feedmill:v1:products`,
`feedmill:v1:settings`, and `feedmill:v1:orders` in the current browser. A
missing, corrupt, or version-mismatched payload is reseeded from
`js/data/seed.js`. Opening the storefront in another tab picks up CMS changes
live via storage events.

## Asset credits

Product photos for chicken and garri are local files already in the repo.
Turkey and palm-oil photos are free-to-use stock, downloaded for offline use
and **flagged for replacement with the client's own photos before any real
use**:

- Turkey — “Roast turkey from fall season” by Jim the Photographer, CC BY
  (<https://commons.wikimedia.org/w/index.php?curid=85144466>),
  stored at `image/stock/turkey.jpg`.
- 3L Palm Oil — “Epo (red palm oil)” by 6th.quan, CC BY-SA
  (<https://commons.wikimedia.org/w/index.php?curid=149079499>),
  stored at `image/stock/palm-oil-3l.jpg`.
- 5L Palm Oil — “Selling red palm oil in a market” by Minette Lontsie,
  CC BY-SA (<https://commons.wikimedia.org/w/index.php?curid=63986402>),
  stored at `image/stock/palm-oil-5l.jpg`.

`image/rice.jpg` is unused because rice is not in the catalogue.

## What is deliberately deferred

No real payments (bank transfer only; Paystack fields exist in the order
schema), no real backend or hosting choice, no real email (digest is
preview-only), no Google Sheets sync, no XLSX export, single demo password
with no real auth, no inventory counts (availability is a boolean), no
delivery zones, no customer accounts, and no legal or analytics pages. The
API contract in [`docs/api-contract.md`](docs/api-contract.md) defines the
future Flask or Node endpoints so the `HttpApi` can be built without touching
the UI.
