# 07: Settings editor and live storefront wiring

**What to build:** The owner edits the business details that make the demo feel real — brand, contact, pickup address, bank details, delivery fee, and digest settings — and sees those changes immediately in the storefront, checkout, and confirmation.

**Blocked by:** 03 — Checkout, validation, and order confirmation; 04 — Admin login and product management

**Status:** ready-for-agent

- [x] The Settings tab edits brand name, tagline, contact phone, WhatsApp number, email, address, pickup address, bank name, account name, account number, payment instructions, delivery fee, digest time, and digest recipient.
- [x] Saving validates required fields and the numeric delivery fee, with visible success and failure feedback.
- [x] Brand and contact changes update the storefront header/footer and WhatsApp link.
- [x] Pickup address changes update pickup confirmations.
- [x] Bank details and payment instructions update the confirmation screen.
- [x] Delivery fee changes update the checkout summary and new order totals; existing orders keep their snapshots.
- [x] Digest settings persist for the digest preview.
- [x] Tests cover settings persistence, validation, storefront/confirmation wiring, delivery fee recalculation, and existing-order immutability.
- [x] The settings form is mobile-friendly and keyboard-accessible.

## Comments

- **2026-11-26** — Implemented in `feat(07)` commit. `updateSettings` validates the merged settings (required brand/contact/WhatsApp/pickup/bank/account(10-digit)/fee(0–100000)/digest-time(HH:MM)/digest-recipient) and persists; the Settings tab renders all 14 fields with inline errors and save feedback. Storefront reloads settings/products on cross-tab `storage` events, so brand, contact, WhatsApp, pickup, bank, and fee changes appear live; new delivery orders use the new fee while past orders keep snapshots. Tests: validation, settings contract (incl. fee recalculation + snapshot immutability), settings-tab save/errors, cross-tab reload, namespace filtering, and confirmation wiring — 90 passing across 15 files.
