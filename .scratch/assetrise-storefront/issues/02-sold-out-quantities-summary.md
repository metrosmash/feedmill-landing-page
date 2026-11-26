# 02: Sold-out state, quantity steppers, and live order summary

**What to build:** Customers can see sold-out products clearly, choose quantities per product, choose pickup or delivery, and watch a live order summary update with subtotal, delivery fee, and total. Garri starts sold out so the treatment is visible immediately.

**Blocked by:** 01 — Foundation — neutral shell, seed catalogue, and API adapter

**Status:** ready-for-agent

- [ ] Garri is seeded sold out and renders greyscale with a diagonal SOLD OUT ribbon.
- [ ] Sold-out products keep their card visible but have disabled quantity controls and cannot be added to the order.
- [ ] Every available product has accessible increase and decrease controls, with a minimum of 0 and a maximum of 99.
- [ ] Setting a quantity to zero removes that product from the order.
- [ ] The order summary lists items, quantities, line totals, subtotal, delivery fee, and total.
- [ ] The summary updates immediately when quantities change.
- [ ] The customer can choose pickup or delivery; pickup is free and delivery adds the configured flat fee.
- [ ] The summary reflects the delivery fee; the delivery address field arrives with checkout in ticket 03.
- [ ] Prices are formatted in NGN.
- [ ] Tests cover sold-out rendering, quantity bounds, zero removal, pickup versus delivery totals, and summary updates.
- [ ] The ordering UI remains usable on mobile and with a keyboard.
