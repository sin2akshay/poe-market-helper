# Path of Exile Developer Knowledge Base

Source: https://www.pathofexile.com/developer/docs/index (fetched 2026-07-07)

This is a working knowledge base distilled from GGG's official developer docs for
Path of Exile (PoE1) and Path of Exile 2 (PoE2). Use it as a reference when deciding
what to build against the official API/tooling. It does **not** cover unofficial/
reverse-engineered data (e.g. poe.ninja, RePoE, Path of Building's game data dumps) —
those are separate ecosystems worth researching separately if the official API is
too limited for an idea.

## Contents

- [01-policy-and-getting-started.md](01-policy-and-getting-started.md) — who can build what, how to register an app, guidelines, User-Agent requirements
- [02-authorization.md](02-authorization.md) — OAuth 2.1 flows, client types, scopes, token lifecycle
- [03-api-reference.md](03-api-reference.md) — every REST endpoint, params, scopes, PoE1 vs PoE2 availability
- [04-errors-and-rate-limits.md](04-errors-and-rate-limits.md) — HTTP/error codes and the dynamic rate-limit header protocol
- [05-file-formats.md](05-file-formats.md) — Item Filter files and PoE2 Build Planner `.build` JSON format
- [06-data-exports.md](06-data-exports.md) — officially sanctioned bulk data (passive tree exports)
- [07-changelog.md](07-changelog.md) — condensed history of API changes, useful for spotting patterns/trends
- [08-poe2-market-data-landscape.md](08-poe2-market-data-landscape.md) — what's officially buildable for PoE2 market/economy data today, plus a canvass of existing tools (poe.ninja, Exiled Tools, Exiled Exchange 2, etc.) and how they actually source data
- [09-poe2fun-strategy-notes.md](09-poe2fun-strategy-notes.md) — poe2fun.com's feature set and buy/sell-spread flip methodology, and why our current data source can't fully replicate it
- [10-implementation.md](10-implementation.md) — architecture, DB schema, full API reference, and Angular app structure for the actual ingestion pipeline + dashboard built in this repo

## What's built (as of 2026-07-07)

This repo now has a working personal PoE2 economy tracker, not just research:
ingestion pipeline (poe.ninja → SQLite) + REST API + Angular dashboard with
four views (Overview, Currency, Unique items, Flip finder). See the root
[README.md](../README.md) for how to run it and
[10-implementation.md](10-implementation.md) for how it's built.

## Quick orientation

- **Base API URL:** `https://api.pathofexile.com`
- **Auth:** OAuth 2.1 only (`/oauth/authorize`, `/oauth/token`) — no API keys.
- **Two realms:** PoE1 (`pc`/`xbox`/`sony`) and PoE2 (`poe2`). Many endpoints are
  **PoE1-only** (stashes, guild stashes, PvP, league-accounts). PoE2 currently only
  exposes: profile, item filters, leagues (no ladders beyond top 1000... actually now
  enabled as of 0.5.0), characters, currency exchange.
- **No general bulk data access.** Only passive-tree data is exported officially
  (GitHub repos). Anything else (item bases, mods, unique items, etc.) requires
  scraping trade site / using community-maintained datasets — flag this early if an
  idea depends on it.
- **Getting an app approved requires a real, specific justification per scope** —
  GGG explicitly rejects low-effort/LLM-sounding requests. Plan the concrete scopes
  and grant type needed before applying.

## Idea-screening checklist (use this before committing to a project idea)

1. **What data does the idea need?** Check [03-api-reference.md](03-api-reference.md) —
   is it available at all? Is it PoE1-only when you wanted PoE2 (or vice versa)?
2. **Who is the data about?** If it's about *the requesting user's own account*
   (their characters/stashes/filters), you need `account:*` scopes + Authorization
   Code + PKCE grant. If it's *service-wide* (leagues, ladders, public stash feed,
   currency exchange), you need `service:*` scopes + Client Credentials grant, and
   your app must be a **confidential client** (can't be a pure frontend/browser app).
3. **Does it require writing to the game or automating input?** Almost certainly
   against the Third-Party Policy — see [01-policy-and-getting-started.md](01-policy-and-getting-started.md).
   Read-only tools (trackers, planners, filter editors, market tools) are the safe zone.
4. **Does it need to run entirely client-side (e.g., a static web app / browser
   extension)?** Public clients can't use `service:*` scopes, so anything needing
   Public Stash / Currency Exchange / league ladders needs a backend component.
5. **Rate limits:** service endpoints (public stash tabs, currency exchange, ladders)
   are shared/precious — design for polling politely and caching (see
   [04-errors-and-rate-limits.md](04-errors-and-rate-limits.md)).
6. **File-format-only ideas** (item filter generators/optimizers, PoE2 build
   planner import files) don't need OAuth at all — see
   [05-file-formats.md](05-file-formats.md).
