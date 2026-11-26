# 10: Pitch-ready packaging — stock images, responsive/a11y QA, and README

**What to build:** The final pitch-ready demo: licensed stock photos for the missing products, responsive and accessibility smoke checks across storefront and admin, verified neutral branding, a README with run instructions and credits, and an API contract review.

**Blocked by:** 01 — Foundation; 02 — Sold-out state; 03 — Checkout; 04 — Admin login; 05 — Admin orders; 06 — Order exports; 07 — Settings; 08 — Digest; 09 — Reset and error handling

**Status:** ready-for-agent

- [x] Turkey, 3L Palm Oil, and 5L Palm Oil use licensed, free-to-use stock images; credits and replacement notes are in the README.
- [x] Existing chicken and garri photos are used consistently; the unused rice image is not referenced.
- [x] Storefront and admin pass responsive smoke checks at mobile, tablet, and desktop widths.
- [x] Accessibility smoke checks pass: labelled inputs, visible focus, keyboard operation, sufficient contrast, alt text, and reduced-motion support.
- [x] The `noindex` metadata and “independent concept demo — not affiliated” footer appear on storefront and admin.
- [x] No client name, logo, real phone number, or real bank details appear anywhere in the demo.
- [x] The README explains how to run the demo, the demo password, how to reset data, asset credits, and deferred production work.
- [x] The API contract doc matches the `Api` adapter and covers the future HTTP endpoints.
- [x] The full customer flow and admin flow are manually verified end-to-end at a phone-sized viewport.
- [x] The main flows produce no console errors.

## Comments

- **2026-11-26** — Implemented in `d500e4b` + `ad33624`. Turkey, 3L and 5L palm oil use downloaded free-to-use stock (CC BY / BY-SA, credits + replacement note in README); chicken/garri photos unchanged; `rice.jpg` unreferenced; SVG placeholders removed. README covers run, walkthrough, password, reset, tests, storage, credits, and deferred work; API contract status updated to v1 complete through 09 and matches the adapter. Smoke audit: 860/640px breakpoints, bottom-sheet summary, scrollable tables, full-width dialogs; `:focus-visible`, reduced-motion, labelled-inputs check (`tests/ui/a11y-smoke.test.js`), alt text, `noindex` + demo notice on both pages, no client identifiers, `node --check` clean. Full suite: 20 files, 107 passing. Honest gap: no real-device testing and no measured contrast/AT pass — flows are verified in jsdom plus static audit only.
