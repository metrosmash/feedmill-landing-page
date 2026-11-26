# 03: Checkout, validation, and order confirmation

**What to build:** Customers complete a Google-Form-style checkout — name, phone, optional email, delivery address when needed, and notes — with inline validation, then submit an order and see a confirmation with an order number, bank-transfer details, a WhatsApp link, and next steps. Orders are persisted with item snapshots and adapter-side pricing, and sold-out products are rejected at submission.

**Blocked by:** 02 — Sold-out state, quantity steppers, and live order summary

**Status:** ready-for-agent

- [x] The checkout collects full name, phone, optional email, delivery address when delivery is selected, and optional notes.
- [x] Inline validation covers required fields, phone format, optional email format, delivery address for delivery orders, and notes length; errors are field-level and accessible.
- [x] Customer selections and details survive a validation error.
- [x] Submitting creates an order through `MockApi` with item snapshots, subtotal, delivery fee, total, status `new`, and payment status `unpaid`.
- [x] Prices and totals are recomputed from current product data; client-supplied totals are ignored.
- [x] Unknown or sold-out products are rejected with a clear error, including a product that becomes sold out between page load and submit.
- [x] Order ids are human-readable and date-based with a per-day sequence.
- [x] The confirmation shows the order number, items, total, bank-transfer details, a WhatsApp button with a prefilled message, and next-step copy.
- [x] Pickup confirmations show the pickup address; delivery confirmations show the delivery address.
- [x] The order persists in localStorage and can be retrieved by the adapter.
- [x] Tests cover validation, pickup versus delivery totals, sold-out rejection, order persistence, and confirmation content.
- [x] The checkout remains keyboard-accessible and mobile-friendly.

## Comments

- **2026-11-26** — Implemented in `5b6039b`. `createOrder` validates customer fields (name 2–80, Nigerian phone, optional email, delivery address 5–200 for delivery, notes ≤500), recomputes all prices from current products/settings, rejects unknown (`not_found`) and sold-out (`sold_out`) products, and issues `FF-YYYYMMDD-NNN` ids with a per-day sequence. Checkout keeps user input on validation errors with field-level `aria-invalid` messages; a sold-out race refreshes the catalogue, drops the stale item, and shows a named banner. Confirmation shows order number, items, total, bank details, a `wa.me` prefilled WhatsApp button, next steps, and pickup/delivery address; the last order restores from `sessionStorage` after refresh. Tests: validation, order contract, and full checkout flows in `npm test` (76 passing across 12 files).
