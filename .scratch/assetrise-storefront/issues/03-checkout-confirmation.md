# 03: Checkout, validation, and order confirmation

**What to build:** Customers complete a Google-Form-style checkout — name, phone, optional email, delivery address when needed, and notes — with inline validation, then submit an order and see a confirmation with an order number, bank-transfer details, a WhatsApp link, and next steps. Orders are persisted with item snapshots and adapter-side pricing, and sold-out products are rejected at submission.

**Blocked by:** 02 — Sold-out state, quantity steppers, and live order summary

**Status:** ready-for-agent

- [ ] The checkout collects full name, phone, optional email, delivery address when delivery is selected, and optional notes.
- [ ] Inline validation covers required fields, phone format, optional email format, delivery address for delivery orders, and notes length; errors are field-level and accessible.
- [ ] Customer selections and details survive a validation error.
- [ ] Submitting creates an order through `MockApi` with item snapshots, subtotal, delivery fee, total, status `new`, and payment status `unpaid`.
- [ ] Prices and totals are recomputed from current product data; client-supplied totals are ignored.
- [ ] Unknown or sold-out products are rejected with a clear error, including a product that becomes sold out between page load and submit.
- [ ] Order ids are human-readable and date-based with a per-day sequence.
- [ ] The confirmation shows the order number, items, total, bank-transfer details, a WhatsApp button with a prefilled message, and next-step copy.
- [ ] Pickup confirmations show the pickup address; delivery confirmations show the delivery address.
- [ ] The order persists in localStorage and can be retrieved by the adapter.
- [ ] Tests cover validation, pickup versus delivery totals, sold-out rejection, order persistence, and confirmation content.
- [ ] The checkout remains keyboard-accessible and mobile-friendly.
