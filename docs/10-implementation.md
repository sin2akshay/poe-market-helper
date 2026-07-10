# Implementation Notes — what's actually built

This documents the working system in this repo, as of 2026-07-09. See
[08-poe2-market-data-landscape.md](08-poe2-market-data-landscape.md) for why
these particular choices (poe.ninja, phased approach) were made, and
[09-community-flip-tool-strategy-notes.md](09-community-flip-tool-strategy-notes.md) for how this
compares to prior art.

## Architecture

```
poe.ninja PoE2 economy API (unofficial, no auth)
        │  src/poeninja/client.ts
        ▼
src/ingest.ts  ──writes──▶  data/poe2-economy.sqlite  (node:sqlite)
                                     │
                                     │  src/db.ts (read helpers)
                                     ▼
                            src/server.ts (REST API, node:http, port 4300)
                                     │
                        ┌────────────┴────────────┐
                        ▼                          ▼
              serves /api/* JSON          serves web/dist/web
                        │                    (built Angular SPA)
                        ▼
              Angular app calls /api/* via ApiService (HttpClient)
```

Everything runs on plain Node 24 — no build step for the backend (native
TypeScript execution), no ORM, no framework. The only "framework" in the
stack is Angular itself, confined to `web/`.

## Data flow

1. `npm run ingest` hits poe.ninja for every configured category (14 currency
   types, 9 unique-item types — see `src/config.ts`), and inserts one row per
   line item into `currency_snapshots` / `item_snapshots`, all stamped with
   the same `fetched_at` (one ingest run = one snapshot).
2. Nothing auto-refreshes. Re-run `npm run ingest` whenever you want a new
   data point — each run adds to history rather than overwriting it, so
   `src/server.ts`'s `/history` endpoints get more meaningful the more often
   you run it.
3. `src/server.ts` reads the latest (or a specified) `fetched_at` snapshot for
   the "current" views, and full time series across all snapshots for the
   history views.

## Database schema

Two tables, both indexed on `(league, item_id, fetched_at)`:

**`currency_snapshots`**: `fetched_at, league, overview_type, item_id,
primary_value, volume_primary_value, max_volume_currency, max_volume_rate,
spark_total_change, sparkline_json`

**`item_snapshots`**: `fetched_at, league, overview_type, item_id,
details_id, name, base_type, category, level_required, primary_value,
listing_count, corrupted, spark_total_change, sparkline_json`

`item_id` for items is poe.ninja's composite `"{name} {baseType}"` string (not
a stable numeric id) — that's what `/items/history` keys on. `sparkline_json`
stores poe.ninja's own 7-point trend array verbatim, as JSON text.

## API reference (`src/server.ts`, port 4300)

All endpoints are `GET`, CORS-open (`*`), JSON. There's no auth — this is a
localhost-only personal tool.

| Endpoint | Params | Returns |
|---|---|---|
| `/api/meta` | — | `{ league, currencyExchangeTypes[], stashItemTypes[] }` — the category lists from config, for populating UI filters |
| `/api/summary` | — | `{ league, fetchedAt, chaosPerDivine, divinePerChaos, currencyRowCount, itemRowCount, snapshotCount }` for the latest snapshot |
| `/api/currency` | `type?` (omit for all categories), `fetchedAt?` (unix ms, defaults to latest) | `{ fetchedAt, type, lines[] }` — one line per currency with `sparkline` (parsed array) added |
| `/api/currency/history` | `id` (required, e.g. `chaos`) | `{ itemId, points[] }` — `{fetched_at, primary_value, volume_primary_value}` across every snapshot ever taken |
| `/api/items` | `type?`, `sort?` (`value`\|`change`\|`listings`\|`name`), `dir?` (`asc`\|`desc`), `limit?` (max 500), `maxListings?`, `fetchedAt?` | `{ fetchedAt, type, lines[] }` |
| `/api/items/history` | `id` (required, the composite `item_id`) | `{ itemId, points[] }` — `{fetched_at, primary_value, listing_count}` |
| `/api/flips` | `minChange?` (default 20), `maxListings?` (default 60), `minListings?` (default 30), `minVolume?` (default 100), `limit?` (default 30, max 200) | `{ fetchedAt, currencies[], liquidItems[], items[] }` — three strategies split by liquidity: **currencies** = churn flipping (volume ≥ `minVolume` divine, \|change\| ≥ `minChange` — dips count as entries, ranked by true trade volume, base div/ex/chaos excluded); **liquidItems** = items with `listing_count >= minListings`, rising, worth ≥ 0.05 div; **items** = scarce snipes (`listing_count <= maxListings`, spiking — high risk, slow exit). Rationale: real flipping wants high volume; only currencies have true volume (from the in-game Currency Exchange), items only expose listing counts as a supply proxy. |
| `/api/insights` | `fetchedAt?` | Derived market analytics: `rates` (exalted/chaos per divine, derived from the stored `exalted`/`chaos` rows — no schema change), `ratioHistory` (divine price across snapshots, the inflation signal), `breadth` (rising/falling counts for currencies and items), `categoryPulse` (per-category avg change + rising/falling + total volume, volume-ranked), `gainers`/`losers` (liquid currencies only, volume ≥ 5 div), `volumeLeaders`, `mostVolatile` (stddev of per-period sparkline swings), `itemGainers`/`itemLosers` (worth ≥ 0.5 div, ≥ 5 listings) |

`/api/summary` also returns `exaltedPerDivine` alongside `chaosPerDivine`.

All read logic lives in `src/db.ts` (`getSummary`, `getCurrencySnapshot`,
`getCurrencyHistory`, `getItemSnapshot`, `getItemHistory`,
`getFlipCandidates`) — `server.ts` is routing only.

## Local game-art assets (`npm run fetch-assets`)

`src/fetch-assets.ts` downloads game icons locally so the app never hotlinks
CDNs, and the server serves them at `/assets/<file>` (week-long cache
headers) while enriching every API line's `icon` field with the local path.

- **Item icons**: poecdn URLs already present in poe.ninja's item overview
  are stored in `item_snapshots.icon` at ingest (column added via a
  `PRAGMA table_info`-checked migration in `openDb`).
- **Currency icons**: a one-time anonymous fetch of the trade site's public
  static metadata JSON (`/api/trade2/data/static`) — the same file every
  trade-site visitor's browser loads. Its `entry.id` values are exactly the
  slugs poe.ninja uses (verified 100% match: 642/642 currencies, 457 item
  icons on first run).
- Files land in `data/assets/<sha1-prefix>.png` plus `manifest.json`
  (slug→file, source-url→file, and slug→display-name maps). Re-runs only
  download missing files; the server hot-reloads the manifest by mtime so no
  restart is needed. `data/assets/` is tracked in the repo (~1,080 icons,
  ~14 MB) so icons are available on GitHub. Re-run after new leagues.

## Display names & UX conventions

- **Currency display names** come from the same trade-static metadata
  (`manifest.names`): API slugs like `hinekoras-lock` render as "Hinekora's
  Lock". Server-side `enrichCurrency` adds `display_name` to every currency
  line (fallback: title-cased slug for unmatched entries).
- **Item categories** carry GGG tag markup (`Ezomyte [Wand]`,
  `[Sword|One Hand Sword]`); `cleanCategory()` in `server.ts` strips it to
  "Ezomyte Wand" / "One Hand Sword" before responses go out.
- **Overview type names** (`LineageSupportGems`) are prettified client-side
  by `TypeNamePipe` (`web/src/app/core/type-name.pipe.ts`) → "Lineage
  Support Gems"; used in selects, badges, and the category pulse table.
- **Search bars** on Currency, Unique items, and Flip finder filter
  client-side against display names, slugs, base types, and categories.
  Items page fetches the full category (limit 500) so search covers
  everything, not just the first page.
- **Sort indicators** (▲/▼) show on sortable table headers on the Currency
  and Items pages.

## Angular app (`web/`)

Angular 22, standalone components (no NgModules), signal inputs/outputs,
`effect()` for chart re-renders, `inject()` + `takeUntilDestroyed()` patterns.
Chart.js loaded directly
(not via `ng2-charts` — that package now requires Angular 21+, incompatible
with this Node/Angular combo, so chart components wrap Chart.js by hand).

- `src/app/core/models.ts` — TypeScript interfaces mirroring the API responses
- `src/app/core/api.service.ts` — thin `HttpClient` wrapper, one method per endpoint
- `src/app/core/denom.service.ts` — global display-denomination state (signal-based).
  All values are stored/transported in divine; this converts for display using the
  rates from `/api/summary`. The segmented Exalted/Chaos/Divine toggle in the header
  drives it, and every value on every page re-renders reactively. Default is
  **exalted**, since that's PoE2's everyday trade unit (chaos is mid-tier, divine
  high-tier — the reverse of PoE1 muscle memory). Smart precision: ≥1000 → integer
  with thousands separator, scaling down to 2 significant figures for sub-0.01 values.
- `src/app/shared/` — three reusable chart components:
  - `sparkline.component.ts` — tiny inline line chart for table cells
  - `bar-chart.component.ts` — horizontal bar chart (used on Overview)
  - `history-chart.component.ts` — full time-series line chart (used when a
    table row is clicked, on Currency/Items pages)
- `src/app/pages/` — one folder per route: `overview`, `currency`, `items`,
  `flips`, `guide`. Each is self-contained (component + template + styles).
- `guide` is a static strategy page: eight researched PoE2 money-making
  strategies (Currency Exchange arbitrage, multi-hop chains, liquid unique
  flipping, scarce snipes, value-add crafting flips, meta farming via
  Category pulse, the divine hedge, bulk premiums), each tied via router
  links to the dashboard section that supports it, plus a signals-reference
  and a pre-flip checklist. Sourced from Maxroll/Mobalytics trading guides
  and current-league farming consensus (2026-07); revisit after big patches.
- `src/app/shared/range-picker.component.ts` — 24h/7d/30d/All segmented
  control + `filterByRange()` helper, used by the history panels on the
  Currency and Items pages. It filters **our own ingested snapshot history**
  client-side; poe.ninja's sparkline stays a fixed 7-period window that can't
  be re-windowed — these are two different trend layers, and the guide page
  explains the distinction.
- Dev proxy: `web/proxy.conf.json` forwards `/api` to `localhost:4300`, wired
  via `npm start` inside `web/` (`ng serve --proxy-config proxy.conf.json`).

**Build output path**: Angular 22's esbuild-based builder emits to
`web/dist/web/` (the `browser` subfolder was dropped in Angular 22) —
`server.ts` points at that exact path for static serving.

## Running it

- **Just view the dashboard**: `npm run build:web` (once, or after any `web/`
  change) → `npm start` → open `http://localhost:4300`.
- **Frontend dev with hot reload**: `npm run server` in one terminal,
  `npm run dev:web` in another (proxies to the first).
- **Get fresh data**: `npm run ingest` any time; no restart needed, the
  server reads the DB fresh on every request.

## Testing

The Angular app has **67 unit tests** across 10 spec files:

| Suite | Coverage |
|---|---|
| `denom.service.spec.ts` | Denomination switching, rate computation, `convert()`, `formatNumber()` precision tiers, `format()` |
| `api.service.spec.ts` | All 8 endpoints, query param construction, URL encoding |
| `type-name.pipe.spec.ts` | CamelCase splitting, null/empty/acronym edge cases |
| `app.component.spec.ts` | Creation, brand, navigation links, `label()` |
| `sparkline.component.spec.ts` | Canvas rendering, Chart.js registration, signal inputs |
| `range-picker.component.spec.ts` | Four range buttons, default selection, click emission |
| `overview.component.spec.ts` | Loading state, data fetching, trend calculation |
| `currency.component.spec.ts` | Meta/category loading, sort order, search filter, reload |
| `flips.component.spec.ts` | Data loading, search filter, param changes on reload |
| `guide.component.spec.ts` | Creation, heading rendering |

Run with `cd web && npm test` (Karma + Jasmine, headless Chrome).

## Known gaps / deliberately out of scope

- **No scheduling** — per explicit user preference, nothing runs `ingest`
  automatically. History only accumulates when you manually re-run it.
- **`node:sqlite` is experimental** — stable enough for this use case, but a
  Node upgrade could change its API. Flagged in case ingestion/server
  scripts start failing after a Node version bump.
- **Flip finder is a heuristic, not a real order book** — see
  [09-community-flip-tool-strategy-notes.md](09-community-flip-tool-strategy-notes.md). Don't treat
  its output as an executable trade signal without checking the trade site.
- **Single league only** — `CONFIG.league` auto-picks the current softcore
  challenge league; there's no UI to switch leagues or compare across them.
