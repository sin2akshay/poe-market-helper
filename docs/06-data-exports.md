# Data Exports

Source: https://www.pathofexile.com/developer/docs/data

## Policy

GGG does **not** officially provide bulk access to general in-game data (item
bases, mod pools, unique items, monster data, etc.) through any API. "We do
not officially provide access to any in-game data outside of our supported
APIs." The **only** sanctioned bulk exports are the passive skill trees below.

## Officially sanctioned exports

| Data | Game | Repo |
|---|---|---|
| Passive Skill Tree | PoE2 | https://github.com/grindinggear/poe2-skilltree-export |
| Passive Skill Tree | PoE1 | https://github.com/grindinggear/skilltree-export |
| Atlas Passive Tree | PoE1 | https://github.com/grindinggear/atlastree-export |

Format/update-frequency aren't specified in the docs page itself — inspect the
repos directly when a specific idea needs them (they're plain public GitHub
repos, so no auth needed to read them, and they can presumably be watched/
diffed for change detection e.g. via GitHub's API or a git pull on a schedule).

## Implication: everything else needs another source

If an idea needs data like:
- Item base types / mod pools / crafting data
- Unique item stats
- Monster/boss data
- Skill gem data beyond what `/character` returns for a specific character
- Passive tree data for PoE1/PoE2 **beyond** the 3 exports above (though the
  tree exports above are actually fairly comprehensive for tree structure)

...it is **not available from GGG directly**. Options to flag when scoping an
idea that needs this:
1. Community-maintained datasets (e.g. RePoE for PoE1, or PoE2-equivalent
   community projects) — these are unofficial, may lag behind patches, and
   should be vetted for currency/license before depending on them.
2. Derive it live from data the API *does* expose — e.g. item mod text is
   visible in the `Item` type's `explicitMods`/`implicitMods` fields returned
   from Character/Stash/Public-Stash endpoints, so a large enough sample of
   live items can approximate a mod database, but that's a data-mining
   project of its own, not a free lunch.
3. Scope the idea down to only what's officially available (tree-based tools,
   filter tools, market tools using Currency Exchange/Public Stash, account
   viewers).

This is the single biggest constraint to check **first** for any idea
resembling "a build/crafting calculator" or "a comprehensive item database" —
those categories are the ones most likely to require unofficial data sources.
