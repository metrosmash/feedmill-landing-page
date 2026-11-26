# 06: Order exports — JSON and CSV

**What to build:** The owner downloads orders as JSON for future APIs and databases and as CSV for Excel or Google Sheets. Exports contain every order, not just what is on screen.

**Blocked by:** 05 — Admin orders — table, detail, status, and payment

**Status:** ready-for-agent

- [x] The Orders tab offers JSON and CSV downloads.
- [x] JSON export contains the full order records: customer, items, totals, fulfilment, status, payment, and timestamps.
- [x] CSV export has one row per order with stable headers, a readable item summary, subtotal, delivery fee, total, order status, payment status, and created date.
- [x] CSV values containing commas, quotes, or newlines are escaped correctly.
- [x] Exports include all orders, not just the visible page.
- [x] Exporting an empty order list produces a valid file with headers and no rows.
- [x] Tests cover JSON completeness, CSV headers and rows, escaping, empty exports, and all-order inclusion.
- [x] The downloaded files open correctly in Excel or Google Sheets.

## Comments

- **2026-11-26** — Implemented in `5b6039b`. `exportOrders('json'|'csv')` covers all orders: JSON is a versioned envelope (`schemaVersion`, `exportedAt`, `count`, full records); CSV is UTF-8 BOM + CRLF with stable headers and a readable `Name ×n @ ₦p = ₦t` item summary, RFC 4180-escaped. Empty exports yield valid header-only files; filenames are `feedmill-orders-YYYY-MM-DD.{json,csv}`. Admin buttons download via Blob. Tests cover envelope completeness, headers/rows, escaping, empty exports, and format rejection.
