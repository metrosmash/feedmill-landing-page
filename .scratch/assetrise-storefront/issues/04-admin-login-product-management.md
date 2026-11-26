# 04: Admin login and product management

**What to build:** The owner reaches the CMS from the storefront header, signs in with the demo password, and manages the catalogue: list products, add, edit, delete, preview image URLs, and toggle sold out. Storefront changes are visible immediately.

**Blocked by:** 01 — Foundation — neutral shell, seed catalogue, and API adapter

**Status:** ready-for-agent

- [x] The storefront header includes a CMS link; unauthenticated visitors see a login gate.
- [x] The demo password `feedmill2026` signs in, the gate is labelled demo-only, and the session persists for the browser session.
- [x] The admin shell has Products, Orders, and Settings tabs; Orders and Settings show placeholders until tickets 05 and 07.
- [x] The Products tab lists every product with image, name, price, unit, and availability.
- [x] The owner can add a product with name, description, price, unit, image URL, availability, and sort order.
- [x] The owner can edit any product, and the image URL preview updates before saving.
- [x] The owner can delete a product after a confirmation step; past order snapshots remain intact.
- [x] The owner can toggle sold out, and the storefront immediately shows the greyed card and SOLD OUT ribbon.
- [x] A persistent demo-mode notice explains that changes are stored only in the current browser.
- [x] Tests cover the login gate, product CRUD, availability toggle, image preview, delete confirmation, and storefront reflection.
- [x] The admin is usable on mobile and with a keyboard.

## Comments

- **2026-11-26** — Implemented in `5b6039b`. `admin.html` is now the full CMS: `feedmill2026` demo-only login gate with session-scoped persistence and Log out, Products/Orders/Settings tabs (Settings is a placeholder until ticket 07). Products tab lists image/name/price/unit/availability with add (slugged unique id), edit, delete (accessible `<dialog>` confirmation, snapshots intact), live image-URL preview with broken-link fallback, and one-click sold-out toggle reflected immediately via shared localStorage. Persistent demo-mode notice; mobile-friendly and keyboard-accessible. Tests: login gate, CRUD, toggle, preview, exports surface, and session handling.

- **2026-11-26** — Fixed a boot bug: `js/admin.js` defined `mountAdmin` but never called it, so the page sat on "Loading the CMS". The module now mounts itself when the admin skeleton is present; `tests/ui/admin-boot.test.js` guards the regression.

- **2026-11-26** — Fixed image field rejecting local paths: the input was `type="url"`, so native browser validation blocked relative paths (e.g. `image/chicken 2.jpg`) before app validation. The field is now a text input with `inputmode="url"` and `novalidate` on the dialog form; relative, absolute, and remote URLs are all accepted.
