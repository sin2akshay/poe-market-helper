# API Reference

Source: https://www.pathofexile.com/developer/docs/reference

**Base URL:** `https://api.pathofexile.com`

All endpoints require `Authorization: Bearer {token}` and a proper `User-Agent`
header (see [01-policy-and-getting-started.md](01-policy-and-getting-started.md)).

Legend: 🔵 PoE1 only · 🟣 PoE2 only (currently just Ladder) · ⚪ Both realms

## Account Profile ⚪
- `GET /profile` — scope `account:profile`
- No params. Returns: `uuid`, `name`, `locale`, `twitch { name }`.

## Account Item Filters ⚪
- `GET /item-filter` — scope `account:item_filter` — list all filters.
- `GET /item-filter/<id>` — get one.
- `POST /item-filter?validate=true` — create. Body: `filter_name`, `realm`
  (`pc`/`xbox`/`sony`/`poe2`), `description`, `version`, `type`
  (`Normal`/`Ruthless`), `public`, `filter` (raw filter text).
- `POST /item-filter/<id>` — update (partial updates OK). **Public filters can't
  be reverted to private.** May return `202` with a validation error alongside
  the updated object.

## Leagues ⚪
- `GET /league` — scope `service:leagues`. Params: `realm`, `type`
  (`main`/`event`/`season`), `limit` (max 50), `offset`.
- `GET /league/<league>` — scope `service:leagues`. Param: `realm`. Returns
  League or null.
- `GET /league/<league>/ladder` — scope `service:leagues:ladder`. Params:
  `realm`, `sort` (`xp`/`depth`/`depthsolo`/`ancestor`/`time`/`score`/`class`),
  `limit` (max 500), `offset`. **Max entries: 15000 (PoE1) / 1000 (PoE2)**.
- `GET /league/<league>/event-ladder` 🔵 — scope `service:leagues:ladder`. Max
  15000 entries.

## PvP Matches 🔵
- `GET /pvp-match` — scope `service:pvp_matches`. Params: `realm`, `type`
  (`upcoming`/`season`/`league`).
- `GET /pvp-match/<match>` — scope `service:pvp_matches`.
- `GET /pvp-match/<match>/ladder` — scope `service:pvp_matches:ladder`. Params:
  `realm`, `limit` (max 200), `offset`. Max 15000 entries. Returns
  `PvPLadderTeamEntry[]`.

## Account Leagues 🔵
- `GET /account/leagues[/<realm>]` — scope `account:leagues`. Returns leagues
  incl. private ones the account is in.

## Account Characters ⚪
- `GET /character[/<realm>]` — scope `account:characters`. `realm` optional:
  `xbox`/`sony`/`poe2` (default PoE1 PC).
- `GET /character[/<realm>]/<name>` — scope `account:characters`. Returns full
  character incl. equipment, inventory, passives.

## Account Stashes 🔵
- `GET /stash[/<realm>]/<league>` — scope `account:stashes`. List stash tabs.
- `GET /stash[/<realm>]/<league>/<stash_id>[/<substash_id>]` — scope
  `account:stashes`. Returns tab + items.

## League Accounts 🔵
- `GET /league-account[/<realm>]/<league>` — scope `account:league_accounts`.
  Returns allocated atlas passive trees etc.

## Guild Stashes 🔵
- `GET /guild[/<realm>]/stash/<league>` — scope `account:guild:stashes`
  (**granted only on special request** to GGG).
- `GET /guild[/<realm>]/stash/<league>/<stash_id>[/<substash_id>]` — same scope.

## Public Stashes (Public Stash API / PSAPI) 🔵
- `GET /public-stash-tabs[/<realm>]` — scope `service:psapi`. Param: `id`
  (pagination/change-id cursor). Returns `next_change_id` + array of
  `PublicStashChange`. **Data has a ~5-minute delay.** Since 3.20.0 this
  requires OAuth (no more anonymous/guest access). This is the feed that
  powers all third-party price-check/market sites (poe.ninja etc.) — central
  to almost any "market tool" idea.

## Currency Exchange (CXAPI) ⚪
- `GET /currency-exchange[/<realm>][/<id>]` — scope `service:cxapi`. Param
  `id` = unix timestamp cursor. Returns `next_change_id` (unix timestamp) +
  `markets[]`. **Historical/hourly digest data only** (not real-time order
  book) — plan accordingly if building a price tracker.

---

## Key Type Definitions (abridged)

**League:** `id, realm, name, description, category, rules, registerAt, event,
goal, url, startAt, endAt, timedEvent, scoreEvent, delveEvent, ancestorEvent,
leagueEvent`

**LadderEntry:** `rank, dead, retired, ineligible, public, character { id, name,
level, class, time, score, progress, experience, depth }, account`

**Account:** `name, realm, guild, challenges { set, completed, max }, twitch`

**Character:** `id, name, realm, class, league, level, experience, ruthless
(PoE1), expired, deleted, current, equipment, skills (PoE2), inventory (PoE1),
rucksack (PoE1), jewels, passives`

**Item** (large type — highlights): `realm (PoE2), verified, w, h, icon,
support, stackSize, maxStackSize, league, id, gemSockets (PoE2), influences,
elder, shaper, searing, tangled, mutated, monsterLevel, abyssJewel, delve,
fractured, synthesised, sockets, socketedItems, name, typeLine, baseType,
rarity, identified, itemLevel, ilvl, note, lockedToCharacter, lockedToAccount,
duplicated, split, corrupted, doubleCorrupted (PoE2), sanctified (PoE2),
unmodifiable, properties, requirements, additionalProperties, enchantMods,
runeMods (PoE2), implicitMods, explicitMods, craftedMods, fracturedMods,
descrText, flavourText, foilVariation, replica, frameTypeId, hybrid`

**StashTab:** `id, parent, folder, name, type, index, metadata { public,
folder, colour, map }, children, items`

**ItemFilter:** `id, filter_name, realm, description, version, type, public,
filter, validation { valid, version, validated }`

**PassiveNode:** `skill, name, icon, isKeystone, isNotable, isMastery,
inactiveIcon, activeIcon, activeEffectImage, masteryEffects, isBlighted,
isTattoo, isProxy, isJewelSocket, expansionJewel, recipe, grantedStrength/
Dexterity/Intelligence, ascendancyName, isAscendancyStart, isMultipleChoice,
grantedPassivePoints, stats, reminderText, flavourText, orbit, orbitIndex, out,
in`

**CrucibleNode:** `skill, tier, icon, allocated, isNotable, isReward, stats,
reminderText, orbit, orbitIndex, out, in`

**GemTab / GemPage:** `GemTab { name, pages[] }`, `GemPage { skillName,
description, properties, stats }`

## Passive Skill Tree URL encoding (Extra Definitions)

Base64url (RFC 4648 §5) binary blob, used by pathofexile.com/passive-skill-tree
share links and third-party planners. Versions observed:

- **v4** — `uint32 version(4); uint8 class, ascendancy, fullscreen; uint16[] hashes`
- **v5** (Ritual 3.13.0) — adds extended hash list (cluster jewels)
- **v6** (Scourge 3.16.0) — adds mastery effect pairs (`uint32[o]`, packed
  as two `uint16`s each)
- **v6.2** (Keepers of the Flame 3.27.0) — repurposes ascendancy byte's 6
  high bits for Bloodlines, backward compatible
- **v7** (PoE2 0.5.0) — `uint32 version(7); uint8 class, ascendancy; uint16
  count(n); data[n]` where each entry has node hash + flags + optional
  weapon-set + optional skill-override hash
- **Atlas Skill Tree** (PoE1 3.17.0+) — same shape as regular tree, with
  class/ascendancy bytes zeroed and extended/mastery lists empty

This encoding is the basis for building a build-sharing/import tool or a
custom passive-tree planner.

## Availability summary

- **PoE1 PC-only:** Account Leagues, Account Stashes, League Accounts, Guild
  Stashes, Public Stashes, PvP Matches, some ladder `sort` types, event-ladder.
- **PoE2-only:** `skills[]` on Character, `gemSockets` on Item, several
  PoE2-specific item properties (`doubleCorrupted`, `sanctified`,
  `desecratedMods`, etc.), v7 passive tree URLs, PoE2 Build Planner file format.
- **Both:** Profile, Item Filters, Leagues (`realm` param), Characters,
  Currency Exchange, League ladder (PoE2 ladder enabled as of 0.5.0, capped
  at 1000 entries vs PoE1's 15000).
