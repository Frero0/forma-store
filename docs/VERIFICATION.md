# Verification notes

## Baseline and safety

The active app was confirmed in `src/index.js`, using React 18, esbuild and six products in `src/cart.cjs`. The previous cart checks passed; inactive legacy SDK components were present. No applicable AGENTS.md or existing application Git repository was found.

The existing `.env` was treated as sensitive and left untouched. The initial commit deliberately contains only an allowlist of reviewed active files, build scripts and cart tests. It excludes `.env`, archived lockfiles, inactive integrations, installed dependencies, IDE files and build output.

The existing Git identity `Federico Santorsola <166096298+Frero0@users.noreply.github.com>` was checked against the connected Frero0 profile and applied locally. No old authors were rewritten. No remote repository, push or deployment was performed.

## Automated checks

- Clean `npm ci --offline --cache /tmp/forma-npm-cache` passed after populating a dedicated cache from the lockfile.
- TypeScript strict typecheck and ESLint passed.
- Eleven Vitest tests cover integer-cent arithmetic, delivery thresholds, variant-aware identities, stock caps, price reconstruction, invalid and legacy rows, duplicate merging, bilingual search, filters/sorting, URL round trips, Italy-specific validation, snapshots, duplicate submission, unavailable/corrupt storage and EUR formatting.
- Vite production build passed, with approximately 183 KB JavaScript (56 KB gzip) and 14 KB CSS (4 KB gzip).
- Dependency installation reported zero vulnerabilities.

## Production browser checks

Chrome headless with Playwright on Linux, starting with an Italian browser locale. The application correctly starts in English.

Verified: English/Italian switching and persistence; empty search results, reset, category filtering, sorting and filter reload; direct product URL; Natural/Forest variants as separate rows; wishlist; cart quantity changes and reload persistence; inline validation; sample data; language switching without field loss; back/forward checkout steps; express delivery; a consistent €216.00 demo total; snapshot confirmation; cleared cart; memory-only order loss after reload; empty cart and missing product states; mobile layout and keyboard focus.

The ordinary flow produced no browser JavaScript errors, missing-asset responses or external requests. The browser explicitly checks that sample shipping email is absent from localStorage. Screenshots in `screenshots/` show the actual home, product, checkout and mobile interface.

The complete flow also passed on the production build served under `/forma-store/` at port 3023, including direct product URLs and local assets. Mobile product and checkout layouts, plus a 768 px tablet checkout, were checked for overflow.

## Limits

Physical devices, Safari, Firefox and screen readers were not tested. Browser printing is provided through `window.print()` and print CSS; a physical printer was not tested. The catalogue and availability are illustrative, not a real inventory system. The simulation deliberately has no server persistence or real payment/shipping/email integration.

CI is configured but has not been executed remotely. See the README for reproduction commands.
