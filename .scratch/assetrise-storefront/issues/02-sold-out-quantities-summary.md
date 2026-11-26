# 02: Sold-out state, quantity steppers, and live order summary

**What to build:** Customers can see sold-out products clearly, choose quantities per product, choose pickup or delivery, and watch a live order summary update with subtotal, delivery fee, and total. Garri starts sold out so the treatment is visible immediately.

**Blocked by:** 01 — Foundation — neutral shell, seed catalogue, and API adapter

**Status:** ready-for-agent

- [x] Garri is seeded sold out and renders greyscale with a diagonal SOLD OUT ribbon.
- [x] Sold-out products keep their card visible but have disabled quantity controls and cannot be added to the order.
- [x] Every available product has accessible increase and decrease controls, with a minimum of 0 and a maximum of 99.
- [x] Setting a quantity to zero removes that product from the order.
- [x] The order summary lists items, quantities, line totals, subtotal, delivery fee, and total.
- [x] The summary updates immediately when quantities change.
- [x] The customer can choose pickup or delivery; pickup is free and delivery adds the configured flat fee.
- [x] The summary reflects the delivery fee; the delivery address field arrives with checkout in ticket 03.
- [x] Prices are formatted in NGN.
- [x] Tests cover sold-out rendering, quantity bounds, zero removal, pickup versus delivery totals, and summary updates.
- [x] The ordering UI remains usable on mobile and with a keyboard.

## Comments

- **2026-11-26** — Implemented in `17d51c6`. Garri renders greyscale with a diagonal SOLD OUT ribbon and disabled steppers; available products get accessible ± controls (0–99, zero removes). `buildOrderSummary` prices available items only, pickup free, delivery adds the configured fee (no fee on empty cart). Summary is a sticky sidebar on desktop and a bottom-sheet sheet on mobile with Escape-to-close. Tests: 34 passing across 7 files (`npm test`).
