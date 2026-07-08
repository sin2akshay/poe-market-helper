# poe2fun.com — Strategy Notes

Research date: 2026-07-07.

## What they offer

Six sections: Gear Insights, Currency Flip, Trade Search, Unique, Guides, Feedback.

**Currency & flipping:**
- **Currency Trends** — exchange-rate history to spot arbitrage.
- **Flip Calculator** — profit/expense/ROI for a proposed flip.
- **Flip Records** — a log of past successful flips (social proof / examples).
- **Currency trading table** — the core tool: shows **buy price** and **sell
  price** separately per currency (not just one value), plus supply/demand
  volume, with an automatically computed **profit margin %** between the two.
  16+ categories (currency, fragments, breach, essences, runes, etc). Updates
  every 30-40 min normally, 5-10 min for high-value currencies.

**Gear:**
- **GG Gear Report** — trending top-tier gear.
- **100D+ Sold History** — historical sales for items that sold above 100 divine.

**Trade efficiency:**
- **T-tier Affix Search**, **Whittling Search** — targeted trade-site searches
  for specific crafting scenarios.
- **Search Bookmarks** — saved/shareable trade queries.

**Unique items:** live price tracking + history, same spirit as poe.ninja's
unique overview.

## The key mechanical difference from what we built

Their currency tool's core value is a **bid/ask spread** (separate buy price
vs. sell price → profit margin), not just a single reference value. That's a
materially different (and more directly "flip-actionable") signal than what
poe.ninja's public `/exchange/current/overview` endpoint gives us — that
endpoint only exposes one `primaryValue` per currency plus a single
`maxVolumeRate` against its most-traded pair. There's no separate buy/sell
quote in that response (verified against the live schema — see
[08-poe2-market-data-landscape.md](08-poe2-market-data-landscape.md)).

Two plausible explanations for where poe2fun's buy/sell spread comes from:
1. **PoE2's actual in-game Currency Exchange** is a real order-book market
   (launched patch 0.3.0), not P2P listings — so a genuine bid/ask spread
   exists in the underlying data. GGG's official `service:cxapi` endpoint
   ("Historical data only; hourly digests") may expose more structure
   (per-market bid/ask) than poe.ninja's simplified public overview does —
   we can't confirm without an approved OAuth app to actually call it.
2. They're deriving it from PoE2 trade-site listings directly (the same
   undocumented `/api/trade2` pattern used by Exiled Exchange 2 and
   `poe2-trade-api`, see [08](08-poe2-market-data-landscape.md)) — real listed
   "buy this now" prices vs "sell this now" asks.

Either way, **we currently can't replicate their exact buy/sell-spread flip
signal** on our chosen data source (path A/B: official Currency Exchange +
poe.ninja public overview). What we built instead is a different, still
principled heuristic: **trend momentum + thin liquidity** (large recent price
swing on unique items with a low `listingCount`) — a reasonable "worth a
second look" signal, but not the same thing as a live, executable buy/sell
spread.

## If we want spread-based flip detection later

That would require either:
- Getting GGG's official Currency Exchange API approved and checking whether
  its raw `markets` data has real bid/ask structure beyond what poe.ninja
  exposes (worth checking first — free and sanctioned), or
- Building the trade2-scraping path we deliberately deprioritized in
  [08-poe2-market-data-landscape.md](08-poe2-market-data-landscape.md) §3
  (option C) — higher effort, ToS-adjacent, last resort.

Not pursuing either right now; flagging so it's a deliberate choice rather
than an oversight.
