export const CONFIG = {
  // poe.ninja asks for a descriptive User-Agent identifying the app + a contact.
  userAgent: "PoE2EconomyTracker/0.1.0 (contact: rock.sapphire@gmail.com)",

  dbPath: new URL("../data/poe2-economy.sqlite", import.meta.url),

  // Set to a specific league name to pin ingestion to it (e.g. "Standard").
  // Leave null to auto-pick the current non-hardcore challenge league.
  league: null as string | null,

  // https://poe.ninja/docs/api - accepted `type` values per overview kind.
  currencyExchangeTypes: [
    "Currency",
    "Fragments",
    "Abyss",
    "UncutGems",
    "LineageSupportGems",
    "Essences",
    "SoulCores",
    "Idols",
    "Runes",
    "Ritual",
    "Expedition",
    "Delirium",
    "Breach",
    "Verisium",
  ],

  stashItemTypes: [
    "UniqueWeapons",
    "UniqueArmours",
    "UniqueAccessories",
    "UniqueFlasks",
    "UniqueCharms",
    "UniqueJewels",
    "UniqueSanctumRelics",
    "UniqueTablets",
    "PrecursorTablets",
  ],
};
