# PoE2 Market/Economy Data: What's Buildable Now + Prior Art

Research date: 2026-07-07. Sources: official dev docs (see files 01-07), web search of
the current PoE2 tool ecosystem.

## 1. What's officially buildable for PoE2 right now

Via the OAuth developer API (`https://api.pathofexile.com`), for the `poe2` realm:

| Capability | Endpoint | Notes |
|---|---|---|
| Currency exchange rates | `GET /currency-exchange/poe2[/<id>]` (`service:cxapi`) | **The only official economy data source for PoE2.** Hourly digests of currency-pair markets (e.g. chaos↔divine). Historical, not live order book. |
| League list | `GET /league?realm=poe2` (`service:leagues`) | Metadata only, not economic. |
| Ladder (top 1000) | `GET /league/<league>/ladder?realm=poe2` (`service:leagues:ladder`) | Added 0.5.0 (May 2026). Character progress, not economy. |
| Own characters/inventory | `/character/poe2[/<name>]` (`account:characters`) | Account-scoped, not market-wide. |
| Item filters | `/item-filter` (`account:item_filter`) | Not economic data. |
| Build Planner `.build` files | Local file format | Not economic data. |

**What's explicitly missing for PoE2:**
- **No Public Stash API for PoE2.** PoE1's `service:psapi` feed (the raw firehose of
  every public stash listing that all real price-tracking tools are built on) is
  PoE1-only. There is currently **no officially sanctioned way to see individual
  item listings/prices at scale for PoE2** — only aggregate currency-pair rates.
- No item/unique/mod database export for either game (see
  [06-data-exports.md](06-data-exports.md)) — only passive-tree data is exported.
- No official PoE2 trade-search API. `pathofexile.com/trade2` exists as a website
  but its `/api/trade2/*` endpoints are **not part of the documented developer
  API** — using them means reverse-engineering an internal endpoint, which GGG's
  own Available Resources policy calls a ToU §7i violation (see
  [01-policy-and-getting-started.md](01-policy-and-getting-started.md)).

**Bottom line:** on official rails alone, a PoE2 economy project is limited to
**currency-pair exchange rate tracking over time** — real and useful (e.g. "how
has the divine:chaos ratio moved this league"), but not item-level pricing.

## 2. Prior art — what the community has actually built

| Project | What it does | Data source (as best determined) |
|---|---|---|
| **[poe.ninja](https://poe.ninja/poe2/economy/)** | The dominant economy aggregator. Covers PoE2: currency prices, unique items, skill gems, sparkline trends, class/build stats. Refresh ~hourly for PoE2. | Says it "pulls from GGG's public APIs," but since there's no Public Stash API for PoE2, their item-level pricing almost certainly also involves trade-site data collection, not just Currency Exchange. Their API (`poe.ninja/swagger`) is explicitly **unofficial as a product** — "exists to run the poe.ninja website... not stable, no SLA, no versioning, can break without notice." |
| **[Exiled Tools](https://www.exiledtools.com/)** | Economy terminal: buy/sell signals, Divine-Orb-relative trend scoring, farming-strategy ranking by divine/hour. | Explicitly built **on top of poe.ninja's prices** (refreshed hourly to match poe.ninja's cadence), plus their own historical trend analysis layered on top. Doesn't source raw data itself. |
| **[poe2fun.com](https://poe2fun.com/currency/trading)** | Live currency price checker; high-value currencies refresh every 5-10min, others 30-40min. | Not confirmed, likely poe.ninja + own polling. |
| **[Exiled Exchange 2](https://github.com/kvan7/Exiled-Exchange-2)** | Desktop overlay price-checking app for PoE2 (successor to Awakened PoE Trade for PoE1). | Needs live item-level trade search → almost certainly talks to the **unofficial** `/api/trade2` endpoints directly (cookie/session based), same pattern as PoE1 tools historically used before Public Stash API existed. |
| **[poe2-trade-api](https://github.com/zenojunior/poe2-trade-api)** (zenojunior) | Infrastructure building block: Playwright headless-browser interceptor that captures `/api/trade2` POST+GET traffic and re-exposes it as a clean REST endpoint. | Explicitly unofficial. Requires extracting a `POESESSID` cookie from a logged-in browser session. No ToS disclaimer in the repo. This is the clearest example of the "gray zone" approach. |
| **MCP server ([mcpmarket.com/server/poe2](https://mcpmarket.com/server/poe2))** | Exposes currency rates, item prices, wiki content, datamined mechanics, and ladder stats as tool-callable endpoints for LLM agents. | Aggregates poe.ninja + wiki + other community sources; interesting as a "market data for AI agents" framing rather than a new data source. |
| **[poe-api-ts](https://github.com/moepmoep12/poe-api-ts)** / **[poe-api-wrappers](https://klayver.github.io/poe-api-wrappers/)** | Typed client libraries wrapping the *official* OAuth dev API (plus some third-party APIs). | Pure plumbing — not products, but useful reference for client implementation patterns. |

### poe.ninja PoE2 economy API — verified, live schema (2026-07-07)

poe.ninja publishes real docs for this at `poe.ninja/docs` → `/docs/api`, and the
endpoints below were hit live and confirmed working (not just summarized from docs).

**Base:** `https://poe.ninja/poe2/api/economy`

- `GET /leagues` → `[{ "id": "Runes of Aldur", "name": "Runes of Aldur" }, ...]`
  (also `Standard`, `Hardcore`, and the HC variant of the current challenge league).

- `GET /exchange/current/overview?league={league}&type={type}`
  `type` ∈ `Currency, Fragments, Abyss, UncutGems, LineageSupportGems, Essences,
  SoulCores, Idols, Runes, Ritual, Expedition, Delirium, Breach, Verisium`
  Response:
  ```json
  {
    "core": {
      "items": [{ "id": "divine", "name": "Divine Orb", "image": "...", "category": "Currency", "detailsId": "divine-orb" }, ...],
      "rates": { "exalted": 641.9, "chaos": 8.82 },
      "primary": "divine", "secondary": "chaos"
    },
    "lines": [
      {
        "id": "chaos",
        "primaryValue": 0.1133,
        "volumePrimaryValue": 243015,
        "maxVolumeCurrency": "divine",
        "maxVolumeRate": 8.82,
        "sparkline": { "totalChange": 0.61, "data": [3.92, 11.04, ...] }
      }, ...
    ]
  }
  ```
  `primaryValue` is priced in the `core.primary` currency (divine, currently).
  `volumePrimaryValue` is a real traded-volume signal — useful for liquidity
  filtering. `sparkline.data` is a short trend series (7 points observed = likely
  last-7-periods, matching hourly-ish refresh).

- `GET /stash/current/item/overview?league={league}&type={type}`
  `type` ∈ `UniqueWeapons, UniqueArmours, UniqueAccessories, UniqueFlasks,
  UniqueCharms, UniqueJewels, UniqueSanctumRelics, UniqueTablets, PrecursorTablets`
  Response `lines[]` includes: `id`, `itemId`, `detailsId`, `name`, `baseType`,
  `icon`, `flavourText`, `levelRequired`, `category`, `primaryValue`,
  `listingCount`, `corrupted`, `sparkLine`, `implicitModifiers[]`,
  `explicitModifiers[]` (each `{ text, optional }`), plus a `requirements`-style
  block (truncated in the sample pulled). **`listingCount` is exactly the kind of
  liquidity signal a flip-finder needs** — low `listingCount` + rising
  `sparkLine.totalChange` is a reasonable first-pass "trending/scarce" heuristic,
  though it's still an aggregate valuation, not live individual listing prices.

**Usage terms (from poe.ninja's own docs):**
- Responses are HTTP-cached (~5 min, ETag-based); underlying PoE2 data refreshes
  ~hourly. **Polling faster than every few minutes wastes bandwidth and gains
  nothing** — the data simply hasn't changed.
- Send a descriptive `User-Agent` identifying your app + contact, same spirit as
  GGG's own requirement.
- Keep concurrency/volume reasonable; misbehaving clients get blocked.
- Desktop apps should proxy through a backend rather than calling from the
  client directly.
- Don't directly replicate/clone the poe.ninja site itself.
- Explicitly: **no SLA, no versioning, breaking changes can happen without
  notice.** Their builds/profile APIs are separately noted as internal/
  unsupported — don't use those even though the economy ones are tolerated.

This closes the gap identified above: **phase 2 (poe.ninja) alone gets most of
the "economic research" and "item price discovery" goals**, including a
reasonable liquidity/trend heuristic for flip-spotting via `listingCount` +
`sparkline`. True live-listing flip detection (buy this exact underpriced
listing right now) still requires trade2-level data (path C) — but that's now
clearly the *last* increment to reach for, not a prerequisite.

There is also an **unofficial-but-longstanding PoE1 trade API pattern**: GGG never
published `/api/trade/search/<league>`, but a GGG forum thread
([view-thread/2720419](https://www.pathofexile.com/forum/view-thread/2720419))
shows staff/community tacitly walking developers through it, with the caution:
*"be wary of the rate limits... and whatever the ToS says about using the API (do
not automate multiple server-side actions within game)."* This is **not** the same
endpoint family as the documented OAuth API — it's cookie/`POESESSID`-based and
technically undocumented, but has been tolerated for years for PoE1. Whether the
same tolerance extends to `/api/trade2` for PoE2 is untested/unconfirmed.

## 3. The real strategic choice

Every actual PoE2 price-checking/economy tool in the wild ends up relying, directly
or via poe.ninja, on **undocumented trade-site scraping** for item-level prices —
because GGG simply hasn't shipped a Public Stash equivalent for PoE2 yet. That
creates three distinct paths with very different risk/reward:

**A. Fully official, currency-only.**
Build on `service:cxapi` alone. Track PoE2 currency-pair exchange rates over time
— trends, volatility, arbitrage-spotting between currencies. Safe, sanctioned,
sustainable, but scoped to currency pairs only, not item/unique prices.

**B. Consume poe.ninja's public (unofficial) economy endpoints.**
Richer: item/unique/gem prices, not just currency. Low effort (it's a stable-ish
public JSON API already relied on by multiple tools). Real risk: explicitly "no
SLA, no versioning, can change without notice" per their own docs — not something
to build a business on, fine for a personal/hobby analytics project.

**C. Build/operate your own trade2 scraper** (à la `poe2-trade-api`).
Most powerful — real listing-level data, full control. Also the most exposed:
directly contradicts GGG's documented "Available Resources" policy against
undocumented endpoint access, requires session cookies (fragile, ToS-adjacent),
and is the least sustainable if GGG decides to enforce.

**Recommendation:** start with **A** as the safe foundation (it's free, sanctioned,
and nobody else is doing much with pure PoE2 Currency Exchange trend analysis
specifically — most existing tools re-skin poe.ninja). Layer in **B** if
item-level data is a hard requirement, treating it explicitly as a soft
dependency that could break. Avoid **C** unless there's a specific reason the
first two aren't enough, given it's the one path that conflicts with GGG's stated
policy.
