# 05: Admin orders — table, detail, status, and payment

**What to build:** The owner reviews orders in a spreadsheet-style table, opens an order to see everything needed to fulfil it, and updates its order and payment status. This is the Google Forms responses view, upgraded.

**Blocked by:** 03 — Checkout, validation, and order confirmation; 04 — Admin login and product management

**Status:** ready-for-agent

- [x] The Orders tab lists orders newest first with date, customer, phone, item summary, fulfilment, total, order status, and payment status.
- [x] Zero orders show a clear empty state.
- [x] Opening an order shows customer details, items with quantities and prices, subtotal, delivery fee, total, notes, fulfilment and address, and timestamps.
- [x] The owner can set order status to `new`, `confirmed`, `delivered`, or `cancelled`.
- [x] The owner can set payment status to `unpaid`, `paid`, or `refunded`.
- [x] Changes persist through `MockApi` and appear in both the table and the detail view.
- [x] Tests cover listing, detail, status transitions, payment updates, persistence, and the empty state.
- [x] The table is usable on mobile and with a keyboard.

## Comments

- **2026-11-26** — Implemented in `5b6039b`. Orders tab lists newest first (date, customer, phone, item summary, fulfilment, total, status, payment) with an empty state, inline status/payment selects, and a detail view (customer, items, totals, notes, address, timestamps) with its own editors. Any status/payment transition is allowed; moving to `cancelled` asks for confirmation. Changes persist through `MockApi` and re-render both table and detail.
