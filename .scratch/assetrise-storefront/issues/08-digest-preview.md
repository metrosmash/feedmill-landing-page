# 08: Daily digest preview and send-now demo

**What to build:** The owner previews the end-of-day email: subject, body, and the orders placed since the last digest. In the demo, “send digest now” shows the same preview and records that the digest was sent, without sending real email.

**Blocked by:** 05 — Admin orders — table, detail, status, and payment; 07 — Settings editor and live storefront wiring

**Status:** ready-for-agent

- [ ] The admin offers a digest preview with the email subject, body, and the orders since the last digest.
- [ ] Each included order shows order number, customer, items, total, fulfilment, and status.
- [ ] Orders included in a previous digest are excluded.
- [ ] “Send digest now” opens the same preview and, after confirmation, updates the last-digest timestamp and marks the included orders as notified.
- [ ] The demo clearly states that no email is sent.
- [ ] Zero new orders show a clear message.
- [ ] Tests cover selection since the last digest, content, timestamp and notified updates, and the empty case.
- [ ] The preview is readable on mobile.
