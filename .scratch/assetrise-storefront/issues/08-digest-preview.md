# 08: Daily digest preview and send-now demo

**What to build:** The owner previews the end-of-day email: subject, body, and the orders placed since the last digest. In the demo, “send digest now” shows the same preview and records that the digest was sent, without sending real email.

**Blocked by:** 05 — Admin orders — table, detail, status, and payment; 07 — Settings editor and live storefront wiring

**Status:** ready-for-agent

- [x] The admin offers a digest preview with the email subject, body, and the orders since the last digest.
- [x] Each included order shows order number, customer, items, total, fulfilment, and status.
- [x] Orders included in a previous digest are excluded.
- [x] “Send digest now” opens the same preview and, after confirmation, updates the last-digest timestamp and marks the included orders as notified.
- [x] The demo clearly states that no email is sent.
- [x] Zero new orders show a clear message.
- [x] Tests cover selection since the last digest, content, timestamp and notified updates, and the empty case.
- [x] The preview is readable on mobile.

## Comments

- **2026-11-26** — Implemented in `52d7668`. `getDigestPreview` selects orders with `createdAt > lastDigestAt` (all orders on first run) and unset `notifiedAt`, oldest first; subject carries brand, date, count, and total, body has per-order blocks plus a grand total, cancelled orders included with status. `sendDigestNow` reuses the same selection, then stamps `lastDigestAt` and `notifiedAt` — no email is sent. Admin Digest tab offers Preview and Send (confirm dialog), an explicit no-email note, and an empty message. Tests: contract selection/content/stamping/empty cases + UI preview/send flows.
