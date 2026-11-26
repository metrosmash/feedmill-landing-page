# 06: Order exports — JSON and CSV

**What to build:** The owner downloads orders as JSON for future APIs and databases and as CSV for Excel or Google Sheets. Exports contain every order, not just what is on screen.

**Blocked by:** 05 — Admin orders — table, detail, status, and payment

**Status:** ready-for-agent

- [ ] The Orders tab offers JSON and CSV downloads.
- [ ] JSON export contains the full order records: customer, items, totals, fulfilment, status, payment, and timestamps.
- [ ] CSV export has one row per order with stable headers, a readable item summary, subtotal, delivery fee, total, order status, payment status, and created date.
- [ ] CSV values containing commas, quotes, or newlines are escaped correctly.
- [ ] Exports include all orders, not just the visible page.
- [ ] Exporting an empty order list produces a valid file with headers and no rows.
- [ ] Tests cover JSON completeness, CSV headers and rows, escaping, empty exports, and all-order inclusion.
- [ ] The downloaded files open correctly in Excel or Google Sheets.
