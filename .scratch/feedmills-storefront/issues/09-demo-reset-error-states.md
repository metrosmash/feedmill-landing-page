# 09: Demo reset, empty states, and error handling

**What to build:** The demo can be reset to a clean seeded shop, and the storefront and admin handle empty catalogues and storage or adapter failures with clear, recoverable states instead of silent failures.

**Blocked by:** 03 — Checkout, validation, and order confirmation; 04 — Admin login and product management; 05 — Admin orders — table, detail, status, and payment; 07 — Settings editor and live storefront wiring

**Status:** ready-for-agent

- [x] The admin offers “Reset demo data” with confirmation; it clears orders, products, and settings, then reseeds the original catalogue and settings.
- [x] After reset, the storefront and admin show the seed data, and Garri is sold out again.
- [x] The storefront shows a clear empty state when no products are available.
- [x] Storage failures such as quota exhaustion or unavailable storage, and adapter/network failures, show a recoverable error instead of failing silently.
- [x] The demo-mode notice remains visible after reset and across admin tabs.
- [x] Tests cover reset and reseed, empty catalogue, storage and adapter failures, and the demo notice.
- [x] The empty and error states are accessible and mobile-friendly.

## Comments

- **2026-11-26** — Implemented in `bf151df`. `resetDemo` clears only `feedmill:` keys then reseeds products/settings and empties orders (Garri sold out again); the Settings tab has a confirmed Reset zone. Distinct empty-shop vs all-sold-out copy; storefront load failures show a recoverable error with Try again; admin sign-in/boot storage failures surface a notice/banner instead of an empty dashboard. Demo-mode notice lives outside the tabs so it persists everywhere. Tests: reset/reseed/namespace, empty/all-sold-out, retry recovery, admin failure notice, notice persistence.
