# File Formats: Item Filters & PoE2 Build Planner

Source: https://www.pathofexile.com/developer/docs/game

These are **local file formats**, not REST APIs — no OAuth needed to read/write
them (though the Item Filter *API* endpoints in
[03-api-reference.md](03-api-reference.md) do require OAuth if you want to
sync filters to a PoE account instead of just editing local files).

## Item Filters

"Item Filters allow you to customise the way loot labels appear. You can edit
the size, colour, or even hide item drops entirely." The developer docs index
page only summarizes this and points to PoE's dedicated Item Filter reference
page for the full filter-syntax grammar (conditions, actions, styles) — that
page should be fetched separately if/when a filter-tooling idea is greenlit,
since the syntax grammar itself (show/hide blocks, conditions like
`ItemLevel`, `Rarity`, `BaseType`, actions like `SetTextColor`,
`PlayAlertSound`, `MinimapIcon`) wasn't captured in this pass.

Relevant sync surface: the `account:item_filter` OAuth scope + `/item-filter`
endpoints let an app **create/update/list a user's in-game filters
programmatically** — e.g. a filter-generator web app that pushes a generated
filter straight into someone's account rather than making them paste text.

## Build Planner (PoE2 only)

"The Build Planner is a game-wide build instructor that integrates with
mission-critical systems such as skills, crafting, passives, and ascendancy."
It's strictly an **import** target — PoE2 doesn't support creating/editing
builds in-game; third-party tools generate the file, the game just consumes it.

### Where files live
- **Windows:** `C:/Users/<Name>/Documents/My Games/Path of Exile 2/BuildPlanner`
- **SteamOS (Steam Deck):**
  `/home/deck/.local/share/Steam/steamapps/compatdata/2315204395/pfx/drive_c/users/steamuser/Documents/My Games/Path of Exile 2/BuildPlanner`

### Format
- JSON, one `Build` object per file.
- File extension: `*.build`
- Schema version: `1` (marked **Experimental** — expect breaking changes).
- The game runs a file-watcher that auto-detects new/changed files in that
  folder — no in-game import UI needed, just drop the file.

### Schema

```
Build {
  name, author, link, description,
  ascendancy,
  passives: BuildPassive[],
  skills: BuildSkill[],
  inventory_slots: BuildInventorySlot[]
}

BuildPassive {
  id, level_interval, weapon_set, additional_text
}

BuildSkill {
  id, level_interval, additional_text,
  support_skills: BuildSupport[]   // meta gems NOT supported
}

BuildSupport {
  id, level_interval, additional_text
}

BuildInventorySlot {
  inventory_id, slot_x, slot_y, level_interval, unique_name, additional_text
}
```

### Rich text in `additional_text` fields
Supports GGG's markup tags:
- Font: `r` (regular), `b` (bold), `i` (italic), `u` (underline), `s`
  (strikethrough), `m` (monospace?), `l` (large) — exact tag semantics should
  be confirmed against the raw docs page if used precisely.
- Color: `red, orange, yellow, green, blue, indigo, violet, black, white,
  grey, bronze, silver, gold, unique, rgb`

### Idea implications
- A **PoE2 build-planner web app** (pick skills/passives/gear, export a
  `.build` file the user drops into the folder) is fully buildable with **zero
  OAuth** — pure file generation. Good low-friction first project if a PoE2
  build tool idea comes up.
- Combine with the passive-tree URL encoding
  ([03-api-reference.md](03-api-reference.md)) and the official PoE2 skill
  tree data export ([06-data-exports.md](06-data-exports.md)) to validate
  passive `id`s and produce accurate node selections.
- `level_interval` fields on passives/skills suggest the format supports
  **leveling guides** (i.e., different setups at different character levels),
  not just an end-state build — worth exploiting for a "leveling planner"
  feature specifically.
