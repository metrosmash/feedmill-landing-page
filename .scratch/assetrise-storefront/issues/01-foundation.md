# 01: Foundation — neutral shell, seed catalogue, and API adapter

**What to build:** A runnable static demo with the neutral Feedmill Farms storefront shell, a seeded catalogue of five products and settings, and a single `Api` adapter with a localStorage-backed `MockApi` read path. Customers can open the page and browse the catalogue with photos, descriptions, units, and NGN prices. The ticket also establishes the API contract and the first contract tests.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The demo runs from a static file server with one command and no build step.
- [ ] The storefront shell includes the neutral Feedmill Farms header, hero, trust strip, footer with the “independent concept demo — not affiliated” notice, and `noindex` metadata.
- [ ] Seed data defines five products — Turkey, Broiler Chicken, Garri, 3L Palm Oil, and 5L Palm Oil — with name, description, placeholder price, unit, image URL, availability, and sort order.
- [ ] Seed settings define brand, tagline, contact, WhatsApp, email, address, pickup address, bank details, payment instructions, delivery fee, currency, digest time, digest recipient, and last digest timestamp.
- [ ] The `Api` contract covers public settings, product listing, order creation, admin authentication, product CRUD and availability, order listing and updates, settings read/write, JSON/CSV export, digest preview, and demo reset.
- [ ] The API contract doc records the public and admin request/response shapes and the error format for a future Flask or Node backend.
- [ ] `MockApi` implements the public settings and product-listing reads from seed data and persists to versioned localStorage.
- [ ] The product grid renders all five products with image, name, description, unit, and NGN price, and is responsive.
- [ ] Chicken and garri use the existing local photos; turkey and palm oil use clearly marked temporary placeholders until ticket 10.
- [ ] Contract tests for public settings and product listing pass against `MockApi`.
- [ ] A UI test confirms the grid renders the seeded products and prices.
- [ ] No client name, logo, real phone number, or real bank details appear in the rendered demo.
