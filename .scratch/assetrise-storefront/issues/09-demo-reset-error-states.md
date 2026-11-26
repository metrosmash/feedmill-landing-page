# 09: Demo reset, empty states, and error handling

**What to build:** The demo can be reset to a clean seeded shop, and the storefront and admin handle empty catalogues and storage or adapter failures with clear, recoverable states instead of silent failures.

**Blocked by:** 03 — Checkout, validation, and order confirmation; 04 — Admin login and product management; 05 — Admin orders — table, detail, status, and payment; 07 — Settings editor and live storefront wiring

**Status:** ready-for-agent

- [ ] The admin offers “Reset demo data” with confirmation; it clears orders, products, and settings, then reseeds the original catalogue and settings.
- [ ] After reset, the storefront and admin show the seed data, and Garri is sold out again.
- [ ] The storefront shows a clear empty state when no products are available.
- [ ] Storage failures such as quota exhaustion or unavailable storage, and adapter/network failures, show a recoverable error instead of failing silently.
- [ ] The demo-mode notice remains visible after reset and across admin tabs.
- [ ] Tests cover reset and reseed, empty catalogue, storage and adapter failures, and the demo notice.
- [ ] The empty and error states are accessible and mobile-friendly.
