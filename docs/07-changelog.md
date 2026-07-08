# API Changelog (condensed)

Source: https://www.pathofexile.com/developer/docs/changelog

Full history preserved for reference; most useful for spotting **trends**
(what GGG has been actively expanding) and **breaking changes** to watch for
if a project depends on a specific field.

- **26/05/2026 — PoE2 EA 0.5.0 "Return of the Ancients"**
  Enabled PoE2 Ladder endpoint (top 1000). Added passive-tree URL v7 for PoE2.
  Added `socketedIcon`, `tamedBeastProperties` to Item. Deprecated `frameType`
  → `frameTypeId`. Parent stashes can now contain items.
- **05/03/2026 — 3.28.0 "Mirage"**
  Added `builtInSupport`, `monsterLevel` to Item.
- **10/12/2025 — PoE2 EA 0.4.0 "The Last of the Druids"**
  Added `doubleCorrupted`, `bondedMods` to Item. Extended `mutated`/
  `mutatedMods` to PoE2 items. Added `passives→quest_stats` to Character.
- **28/10/2025 — 3.27.0 "Keepers of the Flame"**
  Added `mutatedMods`, `mutated` to Item. Added FrameType Breach value (13).
  Passive-tree URL v6.2 (Bloodlines). PoE2 Character endpoint stopped
  returning unequipped inventory items (**breaking change** for PoE2 tools).
- **27/08/2025 — PoE2 EA 0.3.0 "The Third Edict"**
  **Launched Currency Exchange endpoint + `service:cxapi` scope.** Renamed
  Character `specialisations→shapeshift` to `set3`. Added `iconTierText`,
  `sanctified`, `desecratedMods`, `desecrated` to Item. Removed
  `flavourTextParsed`.
- **11/06/2025 — 3.26.0 "Secrets of the Atlas"**
  OAuth docs updated to reference **OAuth 2.1**. Clarified redirect-URI rules
  per client type. Added `memoryItem` to Item. Removed `category`/
  `subcategories` from Item→extended.
- **05/04/2025 — PoE2 EA 0.2.0 "Dawn of the Hunt"**
  Added `poe2` realm option to League endpoints (ladders stayed PoE1-only
  until 0.5.0 above).
- **28/03/2025 — PoE2 EA 0.1.1g**
  Added `poe2` realm to Character endpoints; PoE2-specific Character/Item/
  ItemSocket/ItemProperty fields; PoE2 GemTab/GemPage types.
- **16/01/2025 — PoE2 EA 0.1.1**
  Clarified: at this point **no APIs returned PoE2 data yet** except item
  filter realm support — useful marker for "how young is PoE2 API support."
- **14/11/2024 — 3.25.2 "Shared Account Patch"**
  **All account names now carry a 4-digit discriminator suffix** (relevant:
  this is why app registration requires the discriminator). Added optional
  `realm` param to several account-scoped endpoints.
- **25/07/2024 — 3.25.0 "Settlers"**
  Launched Guild Stashes endpoint (limited-access scope). Deprecated
  `category`/`subcategories` from Item→extended.
- **27/03/2024 — 3.24.0 "Necropolis"**
  Added `atlas_passive_trees` to LeagueAccount.
- **08/12/2023 — 3.23.0 "Affliction"**
  Added `category` to League, `rarity` to Item. `ItemProperty→displayMode`
  became a standalone `DisplayMode` type. Added `rucksack`,
  `passives→alternate_ascendancy` to Character. Passive-tree URL v6.1
  (Wildwood Ascendancy).
- **16/08/2023 — 3.22.0 "Trial of the Ancestors"**
  **Launched Data Exports section.** Added Account Leagues endpoint/scope.
  `Item→frameType` split into standalone `FrameType` type. Added `isTattoo`
  to PassiveNode.
- **25/04/2023 — 3.21.1 "Crucible"** — Added `flavourTextNote` to Item.
- **07/04/2023 — 3.21.0 "Crucible"**
  **Introduced Public Clients.** Made PKCE mandatory for public clients
  (encouraged for confidential). Removed `prompt` param from auth-code flow.
  Added `crucibleMods`, `crucible` to Item. Reworked Challenges type.
- **21/12/2022 — 3.20.1 "Sanctum"** — Added `foilVariation` to Item.
- **28/11/2022 — 3.20.0 "Sanctum"**
  **Public Stashes now requires OAuth** (guest/anonymous access removed).
  Deprecated `lastCharacterName`. Added `ruthless` to Item, `type` to
  ItemFilter.
- **17/08/2022 — 3.19.0 "Lake of Kalandra"**
  Added `ineligible` to LadderEntry. Realm-specific Public Stash details.
  Better Application Credentials docs.
- **11/05/2022 — 3.18.0 "Sentinel"**
  Added `unmodifiable` to Item. Registration process clarified. Introduced
  Available Resources section.
- **02/02/2022 — 3.17.0 "Siege of the Atlas / Archnemesis"**
  Added `searing`, `tangled` to Item, `character.progress` to LadderEntry.
  Removed `online` from LadderEntry. Introduced `LeagueAccount` type/API.
  Atlas Skill Tree URL format.
- **23/10/2021 — 3.16.0 "Scourge"**
  Introduced PassiveGroup/PassiveNode types. Added `scourgeMods`, `scourged`
  to Item, `mastery_effects` to Character. Passive-tree URL v6.
- **27/07/2021 — 3.15.0 "Expedition"** — Added `logbookMods` to Item.
- **09/07/2021 — Ultimatum authorization clarification** — Content-Type
  header requirements documented for POST requests.

## Trends worth noting for planning

1. **PoE2's API surface is still young and actively expanding** (first data
   at all: Jan 2025; Currency Exchange: Aug 2025; Ladder: May 2026). Expect
   continued breaking changes and new endpoints — build PoE2 tools with
   schema flexibility in mind, and re-check the changelog before shipping.
2. **Currency Exchange is the newest service endpoint** — comparatively
   under-explored by third-party tools, possibly a good opportunity area.
3. **Item type is the most churned type** by far — almost every patch adds
   fields. Don't hardcode an exhaustive Item schema; treat unknown fields as
   pass-through / additive.
4. GGG has been **removing/deprecating fields** periodically
   (`category`/`subcategories`, `flavourTextParsed`, `frameType`) — build
   deserializers that tolerate missing fields rather than requiring them.
