# 07: Settings editor and live storefront wiring

**What to build:** The owner edits the business details that make the demo feel real — brand, contact, pickup address, bank details, delivery fee, and digest settings — and sees those changes immediately in the storefront, checkout, and confirmation.

**Blocked by:** 03 — Checkout, validation, and order confirmation; 04 — Admin login and product management

**Status:** ready-for-agent

- [ ] The Settings tab edits brand name, tagline, contact phone, WhatsApp number, email, address, pickup address, bank name, account name, account number, payment instructions, delivery fee, digest time, and digest recipient.
- [ ] Saving validates required fields and the numeric delivery fee, with visible success and failure feedback.
- [ ] Brand and contact changes update the storefront header/footer and WhatsApp link.
- [ ] Pickup address changes update pickup confirmations.
- [ ] Bank details and payment instructions update the confirmation screen.
- [ ] Delivery fee changes update the checkout summary and new order totals; existing orders keep their snapshots.
- [ ] Digest settings persist for the digest preview.
- [ ] Tests cover settings persistence, validation, storefront/confirmation wiring, delivery fee recalculation, and existing-order immutability.
- [ ] The settings form is mobile-friendly and keyboard-accessible.
