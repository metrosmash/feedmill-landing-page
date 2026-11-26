# 10: Pitch-ready packaging — stock images, responsive/a11y QA, and README

**What to build:** The final pitch-ready demo: licensed stock photos for the missing products, responsive and accessibility smoke checks across storefront and admin, verified neutral branding, a README with run instructions and credits, and an API contract review.

**Blocked by:** 01 — Foundation; 02 — Sold-out state; 03 — Checkout; 04 — Admin login; 05 — Admin orders; 06 — Order exports; 07 — Settings; 08 — Digest; 09 — Reset and error handling

**Status:** ready-for-agent

- [ ] Turkey, 3L Palm Oil, and 5L Palm Oil use licensed, free-to-use stock images; credits and replacement notes are in the README.
- [ ] Existing chicken and garri photos are used consistently; the unused rice image is not referenced.
- [ ] Storefront and admin pass responsive smoke checks at mobile, tablet, and desktop widths.
- [ ] Accessibility smoke checks pass: labelled inputs, visible focus, keyboard operation, sufficient contrast, alt text, and reduced-motion support.
- [ ] The `noindex` metadata and “independent concept demo — not affiliated” footer appear on storefront and admin.
- [ ] No client name, logo, real phone number, or real bank details appear anywhere in the demo.
- [ ] The README explains how to run the demo, the demo password, how to reset data, asset credits, and deferred production work.
- [ ] The API contract doc matches the `Api` adapter and covers the future HTTP endpoints.
- [ ] The full customer flow and admin flow are manually verified end-to-end at a phone-sized viewport.
- [ ] The main flows produce no console errors.
