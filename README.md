# PoE2 Economy Tracker

Personal ingestion pipeline for Path of Exile 2 economy data. Snapshots
currency exchange rates and unique-item valuations from poe.ninja's public
PoE2 economy API into a local SQLite database, for trend analysis and
flip-opportunity spotting.

See [docs/](docs/README.md) for the full research this is built on — API
capabilities, what's officially available from GGG vs. poe.ninja, and the
verified poe.ninja schema.

## Requirements

Node.js 24+ (uses native TypeScript execution and the built-in `node:sqlite`
module — no npm install needed).

## Usage

```sh
npm run ingest        # fetch a snapshot and store it in data/poe2-economy.sqlite
npm run fetch-assets  # download item/currency icons locally (re-run after new leagues)
npm run query         # print a quick report: biggest currency movers, thin-liquidity risers
```

Run `ingest` periodically (e.g. hourly via cron / Windows Task Scheduler) to
build up history — poe.ninja's underlying PoE2 data only refreshes about once
an hour, so there's no benefit to running it more often than that.

### Dashboard (Angular)

Build once, then run anytime:

```sh
npm run build:web   # builds web/ into web/dist/web/browser
npm start            # serves the API + the built dashboard on http://localhost:4300
```

Open `http://localhost:4300` — five views: Guide (how to turn each dashboard
signal into an in-game money-making strategy), Overview (an insights dashboard:
divine exchange rates with trend, market breadth, liquid gainers/losers,
volume leaders, volatility ranking, category pulse, and item movers), Currency
(sortable table with per-currency history chart), Unique items (same,
filterable by category and listing count), and Flip finder (the thin-liquidity
+ rising-trend heuristic, with an explicit disclaimer about how it differs from
poe2fun.com's real bid/ask spread — see
[docs/09-poe2fun-strategy-notes.md](docs/09-poe2fun-strategy-notes.md)).

A global Exalted / Chaos / Divine toggle in the header switches the display
denomination everywhere (values are stored in divine; rates are derived from
the snapshot itself).

Re-run `npm run build:web` after pulling changes to `web/`. For active
frontend development with hot reload instead, run `npm run server` in one
terminal and `npm run dev:web` in another (proxies `/api` to the server).

## Project layout

- `src/config.ts` — league selection, which economy categories to pull, User-Agent
- `src/poeninja/` — typed client for `poe.ninja/poe2/api/economy` (leagues,
  currency exchange overview, unique-item stash overview)
- `src/db.ts` — SQLite schema (`currency_snapshots`, `item_snapshots`), inserts, and read queries
- `src/ingest.ts` — pulls one full snapshot across all configured categories
- `src/query.ts` — example report over the latest snapshot
- `src/server.ts` — REST API (`/api/summary`, `/api/currency`, `/api/items`,
  `/api/flips`, plus `/history` variants) and static file server for the built
  Angular app
- `web/` — Angular 19 dashboard (standalone components, Chart.js for charts)

## Status / roadmap

This currently only uses poe.ninja's unofficial (but documented, tolerated)
economy API — no OAuth app registration needed. See
[docs/08-poe2-market-data-landscape.md](docs/08-poe2-market-data-landscape.md)
for the phased plan: official GGG Currency Exchange API is a possible future
addition (needs an approved OAuth app from GGG), and true live-listing flip
detection would need trade2-level data, which is intentionally out of scope
for now.
