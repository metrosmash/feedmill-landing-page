# 05: Admin orders — table, detail, status, and payment

**What to build:** The owner reviews orders in a spreadsheet-style table, opens an order to see everything needed to fulfil it, and updates its order and payment status. This is the Google Forms responses view, upgraded.

**Blocked by:** 03 — Checkout, validation, and order confirmation; 04 — Admin login and product management

**Status:** ready-for-agent

- [ ] The Orders tab lists orders newest first with date, customer, phone, item summary, fulfilment, total, order status, and payment status.
- [ ] Zero orders show a clear empty state.
- [ ] Opening an order shows customer details, items with quantities and prices, subtotal, delivery fee, total, notes, fulfilment and address, and timestamps.
- [ ] The owner can set order status to `new`, `confirmed`, `delivered`, or `cancelled`.
- [ ] The owner can set payment status to `unpaid`, `paid`, or `refunded`.
- [ ] Changes persist through `MockApi` and appear in both the table and the detail view.
- [ ] Tests cover listing, detail, status transitions, payment updates, persistence, and the empty state.
- [ ] The table is usable on mobile and with a keyboard.
