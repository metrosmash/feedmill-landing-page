# Assetrise storefront concept (Feedmill Farms demo)

Status: ready-for-agent

## Problem Statement

A farm-produce business currently sells through a public Google Form. From the customer's side, the form cannot show which products are sold out, has no product photography or prices, collects quantity as one free-text field, and offers a rigid list of pickup and delivery options. From the owner's side, every order is a form response that has to be read, copied, and reconciled by hand, and changing the catalogue means editing the form itself.

The developer wants to pitch this business a better storefront. They need a polished, working demo that shows what the business could have — without using the business's name, logo, or real payment details before permission is granted. The demo must feel like a real shop to the customer, give the owner a simple CMS, keep product and order data in JSON so it can later connect to APIs or a database, export orders like a spreadsheet, and leave a clean path to Paystack.

## Solution

Build a frontend-first static demo under a neutral **Feedmill Farms** brand. Customers browse five seeded products, see sold-out items greyed out with a **SOLD OUT** ribbon, choose quantities per product, select pickup or delivery, submit a Google-Form-style order, and receive an order number with bank-transfer details and a WhatsApp confirmation link.

The owner reaches a CMS link in the header, enters a demo password, and can add, edit, delete, and mark products sold out; review orders in a spreadsheet-style table; download orders as JSON or CSV; preview the daily digest; and edit brand, contact, bank, delivery, and digest settings.

All data access sits behind a single `Api` adapter. A `MockApi` backed by localStorage powers the demo today; a future `HttpApi` can point at a Flask or Node backend without rewriting the UI. The demo is `noindex`ed and carries an "independent concept demo — not affiliated" footer. Hosting, real auth, real email, XLSX export, Google Sheets sync, and Paystack are deliberately deferred.

## User Stories

### Customer

1. As a customer, I want to see all available products with photos, names, descriptions, units, and prices, so that I can decide what to buy.
2. As a customer, I want sold-out products to stay visible but greyed out with a SOLD OUT ribbon, so that I know they exist but cannot order them.
3. As a customer, I want to increase or decrease the quantity of each product, so that I can order the right amount.
4. As a customer, I want to remove a product from my order by setting its quantity to zero, so that I can change my mind.
5. As a customer, I want a running order summary showing items, subtotal, delivery fee, and total, so that I know what I will pay before submitting.
6. As a customer, I want the summary to update as I change quantities, so that I can adjust my order before submitting.
7. As a customer, I want to choose pickup or delivery, so that I can receive my order the way I prefer.
8. As a customer, I want pickup to be free and delivery to show a clear fee, so that there are no surprises.
9. As a customer, I want the delivery address field to appear only when I choose delivery, so that the form stays short.
10. As a customer, I want to enter my name, phone number, optional email, delivery address when needed, and notes, so that the owner can fulfil my order.
11. As a customer, I want the form to validate my details inline, so that I can fix mistakes before submitting.
12. As a customer, I want my selections and details to stay filled in if validation fails, so that I do not have to start over.
13. As a customer, I want to submit an order and receive a unique order number, so that I have a reference for payment and follow-up.
14. As a customer, I want to see the bank transfer details and a WhatsApp button on the confirmation screen, so that I can pay and confirm my order.
15. As a customer, I want the confirmation to explain what happens next, so that I know when to expect contact.
16. As a customer, I want the confirmation to include my items and total, so that I can verify what I ordered.
17. As a customer, I want to see the pickup address, so that I know where to collect my order.
18. As a customer, I want to see the farm's contact and WhatsApp details, so that I can ask questions.
19. As a customer, I want prices in NGN with clear formatting, so that I understand the cost.
20. As a customer, I want the page to work well on my phone, so that I can order on the go.
21. As a customer, I want the form to feel simple and linear like a Google Form, so that I do not get lost.
22. As a customer, I want accessible labels, focus states, and keyboard support, so that I can use the site with assistive technology.
23. As a customer, I want to be prevented from ordering a sold-out item even if it becomes unavailable while I am ordering, so that I do not submit an impossible order.
24. As a customer, I want a clear empty state when no products are available, so that I understand the shop is closed.
25. As a customer, I want the site to load quickly, so that I do not abandon the order.

### Owner

26. As the owner, I want a CMS link in the site header, so that I can find the admin area.
27. As the owner, I want to log in with a single password, so that customers cannot change the catalogue.
28. As the owner, I want to add a product with a name, description, price, unit, image URL, and availability, so that I can expand the catalogue.
29. As the owner, I want to edit any product's details, so that prices and descriptions stay current.
30. As the owner, I want to delete a product after confirmation, so that discontinued items disappear from the storefront.
31. As the owner, I want to toggle a product as sold out, so that it greys out with a ribbon and cannot be ordered.
32. As the owner, I want to see a preview of a product's image URL, so that I can catch broken links before saving.
33. As the owner, I want to see orders in a spreadsheet-style table, so that I can review them like Google Forms responses.
34. As the owner, I want to open an order to see customer details, items, totals, fulfilment, and notes, so that I can fulfil it.
35. As the owner, I want to update an order's status (new, confirmed, delivered, cancelled), so that I can track progress.
36. As the owner, I want to mark an order's payment status (unpaid, paid), so that I know who has transferred.
37. As the owner, I want to download orders as JSON, so that I can connect them to APIs or databases later.
38. As the owner, I want to download orders as CSV, so that I can open them in Excel or Google Sheets.
39. As the owner, I want to preview the daily digest, so that I know what the email will contain.
40. As the owner, I want a "send digest now" action in the demo, so that I can see the flow before real email is connected.
41. As the owner, I want to edit brand, contact, bank, delivery fee, pickup address, and digest settings, so that the site reflects my business.
42. As the owner, I want to reset the demo data, so that I can start a clean pitch.
43. As the owner, I want the admin to work on my phone, so that I can manage orders on the go.
44. As the owner, I want a demo-mode notice in the admin, so that I understand changes are local to my browser.
45. As the owner, I want destructive actions to require confirmation, so that I do not lose data accidentally.

### Developer and future backend

46. As the developer, I want a neutral brand with no client name or logo, so that I can pitch without passing off.
47. As the developer, I want a "concept demo — not affiliated" footer and `noindex`, so that the demo is clearly not official.
48. As the developer, I want the demo to run with one static-server command and no build step, so that I can show it anywhere.
49. As the developer, I want all data access behind an API adapter, so that I can swap the mock for a real backend without rewriting the UI.
50. As the developer, I want seed JSON for products and settings, so that I can reset or customise the demo quickly.
51. As the developer, I want a documented API contract, so that the future Flask or Node backend matches the frontend.
52. As the developer, I want the order schema to include payment fields, so that Paystack can be added later.
53. As the developer, I want JSON as the source of truth for products and orders, so that the data can be linked to APIs and databases.
54. As the developer, I want licensed stock placeholders for missing product photos, so that the demo looks polished without stealing assets.
55. As the developer, I want a README with run and deploy notes, so that I can hand off or revisit the project.
56. As the developer, I want the frontend to be reusable for other farm businesses, so that the neutral demo can be pitched more than once.
57. As the developer, I want the demo to use the client's five product names without their brand, so that the pitch feels tailored but neutral.
58. As a future backend developer, I want the API contract to define product, order, settings, and auth endpoints, so that I can implement the server without guessing.
59. As a future backend developer, I want the order JSON to be stable and versioned, so that exports and integrations do not break.
60. As a future backend developer, I want the sold-out rule enforced server-side, so that clients cannot bypass it.
61. As a future backend developer, I want delivery fees and totals computed server-side, so that prices cannot be tampered with.

## Implementation Decisions

### Demo posture and brand

- The demo is a frontend-first static site with semantic HTML, vanilla CSS, and vanilla JavaScript modules. No framework and no build step.
- The demo brand is the neutral **Feedmill Farms** placeholder. The client's real name, logo, photography rights, phone number, and bank details are not used.
- The page carries a footer stating it is an independent concept demo and is not affiliated with any business. The page and admin are `noindex`.
- The demo runs from a static file server (`python3 -m http.server`) and works on a laptop or phone on the same network.
- The client's identity is used only for internal pitch context, not in the rendered demo.

### Catalogue

- The catalogue mirrors the client's current Google Form: **Turkey**, **Broiler Chicken**, **Garri**, **3L Palm Oil**, and **5L Palm Oil**.
- "Boiler Chicken" in the source form is corrected to "Broiler Chicken" in the demo.
- Rice is not part of the catalogue, even though a rice photo exists in the repo.
- All prices and units are clearly demo placeholders and are editable in the CMS. They are not presented as the client's real prices.
- Turkey and Broiler Chicken are sold live, per bird. Garri is sold per kilogram. Palm oil is sold per 3L or 5L unit.
- Garri is seeded as sold out so the greyed card and SOLD OUT ribbon are visible on the first look. The owner can toggle it back in the CMS.

### Data model

- **Product**: stable id, name, description, price, currency, unit, image URL, availability flag, sort order, created timestamp, updated timestamp.
- **Settings**: brand name, tagline, logo URL, contact phone, WhatsApp number, email, address, pickup address, bank name, account name, account number, payment instructions, flat delivery fee, currency, digest time, digest recipient, last digest timestamp, demo-mode flag.
- **Order**: stable id, created timestamp, customer name, phone, optional email, optional notes, fulfilment method (`pickup` or `delivery`), delivery address when applicable, item snapshots, subtotal, delivery fee, total, order status, payment status, payment provider and reference, notified timestamp.
- **Order item snapshot**: product id, product name, unit, unit price, quantity, line total. Snapshots preserve historical orders when products are edited or deleted.
- **Order status**: `new`, `confirmed`, `delivered`, `cancelled`.
- **Payment status**: `unpaid`, `paid`, `refunded`. Paystack fields are present but unused in the demo.
- Order ids are human-readable and date-based, with a per-day sequence.

### API adapter seam

- The UI talks only to a single `Api` interface. The interface covers public settings, product listing, order creation, admin authentication, product CRUD and availability, order listing and updates, settings read/write, JSON/CSV export, digest preview, and demo reset.
- `MockApi` implements the interface with versioned localStorage keys and seed JSON. It is the only implementation in the demo.
- `HttpApi` is the future implementation and must satisfy the same interface. The API contract is documented so a Flask or Node backend can be built against it.
- The same contract test suite must pass against `MockApi` now and `HttpApi` later.
- The demo session is client-side and explicitly not secure. The demo password is `feedmill2026` and is labelled as demo-only.

### Customer flow

- Header: brand, short navigation, and a CMS link.
- Hero: farm-produce headline, supporting copy, and a primary order call to action.
- Trust strip: farm-fresh, pickup or delivery, bank transfer. No invented certifications, awards, or testimonials.
- Product grid: five cards with large imagery, name, description, unit, price, and a quantity stepper. Sold-out cards are greyscale, carry a diagonal SOLD OUT ribbon, and have disabled controls.
- Order summary: sticky on desktop, bottom sheet on mobile. Shows line items, subtotal, delivery fee, and total.
- Details section: full name, phone, optional email, pickup/delivery choice, delivery address only when delivery is selected, and optional notes.
- Review and submit: a final summary and a single submit action.
- Confirmation: order number, item summary, total, bank-transfer details, WhatsApp button with a prefilled message, and next-step copy.
- Empty state when all products are sold out. Error state for storage/network failure and for a product becoming sold out between page load and submit.

### Validation and pricing rules

- At least one order item is required.
- Each item must reference an existing product, have an integer quantity between 1 and 99, and reference an available product.
- Unit prices and line totals are always recomputed from current product data. Client-supplied totals are ignored.
- Subtotal is the sum of line totals. Delivery fee is the configured flat fee only for delivery; pickup is free. Total is subtotal plus delivery fee.
- Name is required and length-bounded. Phone is required and must contain a valid Nigerian-style number. Email is optional but validated when present. Delivery address is required and length-bounded for delivery orders. Notes are optional and length-bounded.
- Sold-out items are rejected at submission time even if they were available when the page loaded.
- The future backend repeats all validation and pricing rules server-side.

### Admin flow

- The CMS link opens a login gate. The demo password is `feedmill2026`; the gate is labelled as demo-only.
- The admin has three tabs: Products, Orders, and Settings.
- Products: list with image, name, price, unit, availability, and actions. Add and edit use a form with an image URL preview. Delete requires confirmation. Availability is a one-click toggle.
- Orders: spreadsheet-style table with date, customer, phone, items, fulfilment, total, status, and payment status. A detail view shows the full order. Status and payment status are editable.
- Exports: JSON of the full order records and CSV with one row per order, including a readable item summary. CSV is chosen for the demo because it opens in Excel and Google Sheets; XLSX is a production enhancement.
- Digest: a preview modal shows the email subject, body, and the orders that would be included. "Send digest now" opens the same preview in the demo; real sending is deferred.
- Settings: brand, tagline, contact, WhatsApp, email, address, pickup address, bank details, payment instructions, delivery fee, digest time, digest recipient, and demo reset.
- A persistent demo-mode notice explains that changes are stored only in the current browser.
- All destructive actions require confirmation.

### Design direction

- Warm editorial farm aesthetic: cream background, deep forest green, brick-red accent, charcoal text, and a muted sage support colour.
- Display typography with a serif face (Fraunces or similar) and a clean sans-serif for body copy (Inter or similar), with system fallbacks.
- Large product photography, generous spacing, subtle borders, and restrained motion.
- The SOLD OUT ribbon is high-contrast and unmistakable. Sold-out cards remain legible.
- Mobile-first responsive layout, keyboard-accessible controls, visible focus states, labelled inputs, alt text, and respect for reduced-motion preferences.
- No fake social proof, no invented certifications, and no client logo.

### Images

- Existing local images are used for Broiler Chicken and Garri.
- The rice image is not used because rice is not in the catalogue.
- Turkey, 3L Palm Oil, and 5L Palm Oil use licensed stock placeholders from a free-use source, credited in the README and flagged for replacement with the client's own photos.
- Product image URLs are editable in the CMS; the demo supports local and remote URLs.
- Image alt text is derived from the product name and description.

### Demo limitations

- Orders, products, and settings persist only in the current browser via localStorage.
- The admin password is a client-side demo gate, not real security.
- The digest is preview-only; no email is sent.
- Exports are generated client-side.
- No payment is processed; the confirmation shows bank-transfer instructions.
- The demo must not be used to take real orders or hold real customer data.

### Future backend and payment

- The future backend can be Flask on PythonAnywhere or Node on Render/Railway, chosen after the pitch.
- Products, orders, and settings remain JSON files on a persistent disk, with atomic writes and backups.
- Real auth uses a single hashed password, server-side sessions, rate limiting, CSRF protection, and secure cookies.
- Orders are validated and priced server-side. XLSX export, a scheduled email digest via Resend or SMTP, and an optional Google Sheets webhook are added then.
- Paystack is added through an initialize endpoint and webhook that update the existing payment fields. No schema change is required.
- The API contract defines the public and admin endpoints, request/response shapes, and error format.

## Testing Decisions

- Good tests assert external behaviour: given products, settings, and an order input, the adapter returns the expected order, totals, validation errors, and availability decisions. Tests should not assert internal helper names, DOM structure, or CSS.
- The single highest seam is the `Api` adapter. The storefront and admin are exercised through it. `MockApi` and the future `HttpApi` must pass the same contract suite.
- Pure order validation and pricing functions are tested directly: empty orders, quantity bounds, unknown products, sold-out products, pickup versus delivery fees, subtotal and total calculation, required fields, and optional email handling.
- `MockApi` is tested for product CRUD, availability toggling, settings updates, order persistence, order status/payment updates, JSON/CSV export completeness, digest preview selection, and demo reset.
- Storefront integration tests run against `MockApi`: rendering products, sold-out state, quantity changes, summary totals, conditional address, validation errors, successful submission, confirmation content, and the sold-out race condition.
- Admin integration tests run against `MockApi`: login gate, product add/edit/delete/sold-out, order table and detail, status updates, exports, settings save, and reset.
- Browser E2E with Playwright is optional. If added, it is the only second seam and covers one complete order flow and one complete admin flow.
- Accessibility smoke checks cover labels, focus order, keyboard operation, and contrast on the main flows. A full WCAG audit is out of scope.
- Test data uses seed JSON plus fixtures for sold-out products, delivery and pickup orders, invalid inputs, and an empty catalogue.
- There is no prior test art in this greenfield repo; these tests establish the pattern.

## Out of Scope

- Real Paystack or any payment processing. The schema and hooks are prepared only.
- The real backend, hosting choice, and deployment.
- Real email sending, scheduled digests, and email deliverability.
- Google Sheets webhook implementation. The contract is documented for later.
- XLSX generation. The demo exports JSON and CSV.
- Multi-user accounts, roles, permissions, and audit logs.
- Inventory counts or stock levels. Availability is a boolean.
- Delivery zones, distance-based fees, or per-location pricing.
- Customer accounts, order tracking, receipts, or email confirmations.
- Product image uploads. The CMS accepts image URLs.
- Public use of the client's brand, logo, photography, phone number, or bank details.
- Privacy policy, terms, and other legal pages beyond a demo footer note.
- Analytics, marketing pixels, and SEO beyond basic metadata and `noindex`.
- Multi-currency, localisation, and a native mobile app.
- A full accessibility certification or performance budget.

## Further Notes

- The client is **Assetrise Freshmills**, found through a public Google Form. The demo stays neutral until the client gives permission to use their identity.
- The source form's products are Turkey, Boiler Chicken, Garri, 3L Palm Oil, and 5L Palm Oil. The demo corrects "Boiler" to "Broiler."
- The source form's payment is a GTB transfer. The demo uses placeholder bank details, not the real account.
- The source form's contact is a named staff phone number. The demo uses placeholder contact details, not the real number.
- The source form offers three pickup points and any-location delivery. The demo simplifies this to a pickup/delivery choice; the finer logistics are deferred until the client shows interest.
- The source form collects one quantity field. The demo improves this with per-product quantity steppers.
- The demo's neutral brand also makes it reusable for pitches to other farm businesses.
- The demo password is `feedmill2026` and must be labelled as demo-only.
- The repo is greenfield: only four product images exist, with no application code.
- This spec lives under the local-markdown issue tracker at `.scratch/assetrise-storefront/`. The tracker and triage vocabulary are configured in `docs/agents/`; publish with the `ready-for-agent` label.
