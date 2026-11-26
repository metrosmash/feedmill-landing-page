# 01: Foundation — neutral shell, seed catalogue, and API adapter

**What to build:** A runnable static demo with the neutral Feedmill Farms storefront shell, a seeded catalogue of five products and settings, and a single `Api` adapter with a localStorage-backed `MockApi` read path. Customers can open the page and browse the catalogue with photos, descriptions, units, and NGN prices. The ticket also establishes the API contract and the first contract tests.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] The demo runs from a static file server with one command and no build step.
- [x] The storefront shell includes the neutral Feedmill Farms header, hero, trust strip, footer with the “independent concept demo — not affiliated” notice, and `noindex` metadata.
- [x] Seed data defines five products — Turkey, Broiler Chicken, Garri, 3L Palm Oil, and 5L Palm Oil — with name, description, placeholder price, unit, image URL, availability, and sort order.
- [x] Seed settings define brand, tagline, contact, WhatsApp, email, address, pickup address, bank details, payment instructions, delivery fee, currency, digest time, digest recipient, and last digest timestamp.
- [x] The `Api` contract covers public settings, product listing, order creation, admin authentication, product CRUD and availability, order listing and updates, settings read/write, JSON/CSV export, digest preview, and demo reset.
- [x] The API contract doc records the public and admin request/response shapes and the error format for a future Flask or Node backend.
- [x] `MockApi` implements the public settings and product-listing reads from seed data and persists to versioned localStorage.
- [x] The product grid renders all five products with image, name, description, unit, and NGN price, and is responsive.
- [x] Chicken and garri use the existing local photos; turkey and palm oil use clearly marked temporary placeholders until ticket 10.
- [x] Contract tests for public settings and product listing pass against `MockApi`.
- [x] A UI test confirms the grid renders the seeded products and prices.
- [x] No client name, logo, real phone number, or real bank details appear in the rendered demo.

## Comments

- **2026-11-26** — Implemented in `c4d48b1`. The demo runs with `python3 -m http.server 8000` and has no build step. Seed catalogue, versioned `MockApi` read path, storefront shell, and `docs/api-contract.md` are in place. Tests: 18 passing across 4 files (`npm test`). Turkey and both palm oils use temporary SVG placeholders; licensed stock imagery remains for ticket 10.
