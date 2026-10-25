# P2P port — Club Satoshi

Branch `feature/p2p-port`. Delivery: work-unit commits, no PR yet (user owns push/PR).
Test runner: none in this repo (`package.json` has only `lint`). Checks: `npm run build`, `npm run lint`, plus side-by-side comparison against the reference copy.

Reference implementation (unchanged original, local only): `public/p2p/app.html`. That folder is git-ignored on purpose: it serves the duplicate app at `/p2p/app.html` during local development for side-by-side checks, but it must not ship. The untouched source is `C:\Program Files\Programacion\Club satoshi p2p\index.html`.

## Specs

S1. `/p2p` is a subpage of the Club Satoshi site, rendered by the site's own Next.js App Router, wrapped by the existing root layout (site Header, Disclaimer, Footer).

S2. The port is a faithful replica of the original app: same typography (Bricolage Grotesque / Inter / IBM Plex Mono), same palette, same 560px mobile-first column, same copy, same screen flow.

S3. The original app's global CSS must NOT leak into the rest of the site. It lives in a CSS Module scoped under a single `.root` element.

S4. The app keeps being one page with six screens switched by state, not by routes: `home`, `amount`, `pay`, `invoice`, `wait`, `seller`. Same as the original `show()`.

S5. `#panel-cs` still opens the seller panel (hash entry point), and `cs_pedido_activo` still resumes an open order after a refresh.

S6. Purchasing flow is unchanged: amount 1–10 USD → seller assignment → payment method (Pesos CBU / USDT TRC-20) → invoice paste → live order status.

S7. Quote polling: Binance BTC/USDT + CriptoYa blue, every 60 s, with the stored `meta/cotizacion` and then hardcoded 100000/1200 fallbacks.

S8. Seller panel: Google login, availability schedule, liquidity, payment data, ntfy channel, pending orders, order history, admin enable/disable.

S9. Firebase stays client-side (site deploys to GitHub Pages, static, no server routes). No server routes are introduced.

S10. The app's own header and footer are dropped; the site layout provides them. The rate + online-vendor indicator from the app header is kept.

S11. No unrequested behavior changes. Where the original has a bug or an unsafe default, it is preserved as-is and recorded in the Log, not silently "fixed".

## Tasks

| ID | Task | Specs | Route | Status |
|---|---|---|---|---|
| T1 | Safety net: copy original to `public/p2p/app.html`; extract the two giant inline SVGs | S2 | inline | done |
| T2 | `src/components/p2p/p2p.module.css` — original CSS scoped under `.root` | S3 | inline | done |
| T3 | `src/lib/p2p/*` — config, types, utils, store, vendors, bolt11, effects | S6,S7,S9 | inline | done |
| T4 | `P2PApp` shell: state machine, subscriptions, quote timer | S4,S5 | inline | done |
| T5 | Buyer screens: Home, Amount/quote, Pay, Invoice, Wait | S6,S7 | inline | done |
| T6 | Seller panel: login, form, orders, history, admin | S8 | inline | done |
| T7 | `app/p2p/page.tsx` route + nav entry | S1,S10 | inline | done |
| T8 | Build + lint + side-by-side comparison against `public/p2p/app.html` | all | inline | done (visual pass pending on a real device) |

## Log

L1 (user, verbatim): "lo que quiero hacer ahora es agregar un /p2p dentro de la pagina y que me lleve a la app que esta en C:\Program Files\Programacion\Club satoshi p2p"

L2 (user, verbatim): "Quiero que sea Una subpágina Dentro de la página web de Club Satoshi Si es muy complicado pasarlo tal cual tradúcelo al framework Que se está usando , Revisa bien todos los archivos antes de hacer cualquier cosa Haceme las consultas necesarias antes de escribir código , Y también dame las recomendaciones pertinentes De que es lo mas conveniente para hacer En estos casos me interesa que no hagamos sobre ingeniería no Hagas cosas de más por si las dudas limitate a Que lo que ya está sirve"

L3. Decision: full React port (user chose "Port completo a React" over landing page and iframe).

L4. Decision: faithful replica with CSS Module (user chose over club-identity redesign).

L5. Baseline verified: app is 1,732 lines — 376 CSS, 192 markup, 1,148 JS. Six screens toggled by `display:none`. Only route is `#panel-cs`. 31% of the file is two inline SVGs (20,447 and 27,317 chars). Both were extracted: `public/images/p2p-hero.svg` is used by the home screen; `p2p-wordmark.svg` was dropped because the site header replaces the app's own brand.

L6. Baseline encoding verified: file is clean UTF-8 (40 í, 113 ó, 95 á, 19 ñ, 10 ¿). No U+FFFD. Earlier `�` was PowerShell console mangling, not file damage.

L7. Baseline config verified: `FIREBASE_CONFIG` is a real object (project csp2p-609d0), `ADMIN_EMAILS = ["diegocorreadg@gmail.com"]`, `MODO_PRUEBA = false`. The README claiming demo mode by default is stale.

L8. Known preserved risks (not fixed, by S11): client-side admin check by email; `firestore.rules` allows unauthenticated writes to `meta/contador`/`meta/turno`; public read of seller CBU/USDT/invoice; `meta/cotizacion` is read but never written, so the second fallback is dead; seller round-robin `pickSeller` writes `meta/turno` outside a transaction.

L9. Site deploys to GitHub Pages (`./out`). `next.config.mjs` has no `output: 'export'`, so the export step is unverified — flagged to the user, not changed.

L10. `node_modules` installed via `npm ci` (501 packages).

L11. The stylesheet lives at `src/components/p2p/p2p.module.css`, not `app/p2p/`, because `@/*` maps to `./src/*` and the screens import it as `../p2p.module.css`.

L12. `firebase@10.12.2` added; the store uses the compat SDK (same API surface as the original) behind local interfaces instead of `any`.

L13. CSS Modules hashes ID selectors too, so `#amount` / `#txList` never matched `id="..."`. They were converted to `.amount` / `.tx-list` classes; the compiled CSS has zero hashed ID selectors.

L14. `.screen { display: none }` means every rendered screen needs the `active` class. All five screens now include `s.active`; before that fix only the home screen was visible.

L15. The seller panel's "Volver a la web" button was restored in a `<footer>` rendered only on the seller screen (`backToWeb` clears the hash and shows home).

L16. Invoice validation was restored: `InvoiceScreen` receives `lockSats` and runs `checkInvoice` before `onSend` (the original validated inside `invBtn`).

L17. The transactions ticker was rewritten to match the original queue: two mounted rows, random next index excluding the previous, `colorTurn % 3` comment colors, and an instant reset after the 760 ms slide.

L18. `SellerPanel` keeps the form uncontrolled (like the original) with `readForm()` reading named elements, an 8 s reject-arm timer, and a double-submit guard so "Ya envié los Sats" cannot subtract liquidity twice.

L19. Fixed order persistence: `show()` now receives the order number, so `cs_pedido_activo` is written before the first render commits. It was previously reading a stale ref and always clearing the key.

L20. Restored the admin ntfy channel sync: when an admin has a channel, `P2PApp` writes it to `meta/admin`, which is what new-vendor notices use.

L21. Database failure now leaves the store `null` (read-only app, like the original `catch { db = null }`) instead of silently falling back to the local demo store. The fake vendor identity is only used with `MODO_PRUEBA`.

L22. Typography: Bricolage Grotesque / Inter / IBM Plex Mono are loaded from Google Fonts in `app/p2p/page.tsx`; no other page pays for them.

L23. Two fidelity fixes with no behavior change: the confetti canvas is appended to `<body>`, so it takes inline positioning instead of the scoped `.confetti` class; and the FAQ re-folds when leaving the quote screen, as `show()` did.

L24. Deliberate deviations, all requested or documented: the app's own header brand and footer brand block are dropped (site layout provides them), the wordmark SVG is not shipped, `waitSummary` is omitted because the original always hides it, and the seller-panel `order.new` pulse is omitted (sound/alert/auto-switch kept).

L25. Checks: `npm run build` passes and prerenders `○ /p2p`; `npm run lint` reports no P2P findings (only the pre-existing error in `Resources.tsx` and warnings in `About.tsx` / `YouTubeFacade.tsx`); the prerendered HTML has zero `class="…undefined"` and the font links land in `<head>`.

L26. Out of scope, still open for the user: Firebase Console must authorize the site domain; `next.config.mjs` has no `output: 'export'` while the deploy workflow uploads `./out`.

L27. Repo hygiene before committing: `public/p2p/` is git-ignored so the duplicate reference app is never deployed, and the unused wordmark SVG was deleted.
