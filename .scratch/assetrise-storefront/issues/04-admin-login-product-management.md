# 04: Admin login and product management

**What to build:** The owner reaches the CMS from the storefront header, signs in with the demo password, and manages the catalogue: list products, add, edit, delete, preview image URLs, and toggle sold out. Storefront changes are visible immediately.

**Blocked by:** 01 — Foundation — neutral shell, seed catalogue, and API adapter

**Status:** ready-for-agent

- [ ] The storefront header includes a CMS link; unauthenticated visitors see a login gate.
- [ ] The demo password `feedmill2026` signs in, the gate is labelled demo-only, and the session persists for the browser session.
- [ ] The admin shell has Products, Orders, and Settings tabs; Orders and Settings show placeholders until tickets 05 and 07.
- [ ] The Products tab lists every product with image, name, price, unit, and availability.
- [ ] The owner can add a product with name, description, price, unit, image URL, availability, and sort order.
- [ ] The owner can edit any product, and the image URL preview updates before saving.
- [ ] The owner can delete a product after a confirmation step; past order snapshots remain intact.
- [ ] The owner can toggle sold out, and the storefront immediately shows the greyed card and SOLD OUT ribbon.
- [ ] A persistent demo-mode notice explains that changes are stored only in the current browser.
- [ ] Tests cover the login gate, product CRUD, availability toggle, image preview, delete confirmation, and storefront reflection.
- [ ] The admin is usable on mobile and with a keyboard.
