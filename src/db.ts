import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG } from "./config.ts";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS currency_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fetched_at INTEGER NOT NULL,
  league TEXT NOT NULL,
  overview_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  primary_value REAL NOT NULL,
  volume_primary_value REAL,
  max_volume_currency TEXT,
  max_volume_rate REAL,
  spark_total_change REAL,
  sparkline_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_currency_lookup
  ON currency_snapshots (league, item_id, fetched_at);

CREATE TABLE IF NOT EXISTS item_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fetched_at INTEGER NOT NULL,
  league TEXT NOT NULL,
  overview_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  details_id TEXT,
  name TEXT NOT NULL,
  base_type TEXT,
  category TEXT,
  level_required INTEGER,
  primary_value REAL NOT NULL,
  listing_count INTEGER,
  corrupted INTEGER,
  spark_total_change REAL,
  sparkline_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_item_lookup
  ON item_snapshots (league, item_id, fetched_at);
`;

export function openDb(): DatabaseSync {
  const dbPath = fileURLToPath(CONFIG.dbPath);
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

function migrate(db: DatabaseSync): void {
  const cols = db.prepare(`PRAGMA table_info(item_snapshots)`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === "icon")) {
    db.exec(`ALTER TABLE item_snapshots ADD COLUMN icon TEXT`);
  }
}

export interface CurrencySnapshotRow {
  fetchedAt: number;
  league: string;
  overviewType: string;
  itemId: string;
  primaryValue: number;
  volumePrimaryValue: number | null;
  maxVolumeCurrency: string | null;
  maxVolumeRate: number | null;
  sparkTotalChange: number | null;
  sparklineJson: string | null;
}

export interface ItemSnapshotRow {
  fetchedAt: number;
  league: string;
  overviewType: string;
  itemId: string;
  detailsId: string | null;
  name: string;
  baseType: string | null;
  category: string | null;
  levelRequired: number | null;
  primaryValue: number;
  listingCount: number | null;
  corrupted: boolean;
  sparkTotalChange: number | null;
  sparklineJson: string | null;
  icon: string | null;
}

export function insertCurrencySnapshots(db: DatabaseSync, rows: CurrencySnapshotRow[]): void {
  const stmt = db.prepare(`
    INSERT INTO currency_snapshots
      (fetched_at, league, overview_type, item_id, primary_value,
       volume_primary_value, max_volume_currency, max_volume_rate,
       spark_total_change, sparkline_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of rows) {
    stmt.run(
      r.fetchedAt,
      r.league,
      r.overviewType,
      r.itemId,
      r.primaryValue,
      r.volumePrimaryValue,
      r.maxVolumeCurrency,
      r.maxVolumeRate,
      r.sparkTotalChange,
      r.sparklineJson,
    );
  }
}

export function insertItemSnapshots(db: DatabaseSync, rows: ItemSnapshotRow[]): void {
  const stmt = db.prepare(`
    INSERT INTO item_snapshots
      (fetched_at, league, overview_type, item_id, details_id, name, base_type,
       category, level_required, primary_value, listing_count, corrupted,
       spark_total_change, sparkline_json, icon)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of rows) {
    stmt.run(
      r.fetchedAt,
      r.league,
      r.overviewType,
      r.itemId,
      r.detailsId,
      r.name,
      r.baseType,
      r.category,
      r.levelRequired,
      r.primaryValue,
      r.listingCount,
      r.corrupted ? 1 : 0,
      r.sparkTotalChange,
      r.sparklineJson,
      r.icon,
    );
  }
}

// ---- Read helpers used by the API server ----

export function getLatestFetchedAt(db: DatabaseSync): number | null {
  const row = db.prepare(`SELECT MAX(fetched_at) as t FROM currency_snapshots`).get() as
    | { t: number | null }
    | undefined;
  return row?.t ?? null;
}

export function getSnapshotTimestamps(db: DatabaseSync): number[] {
  const rows = db
    .prepare(`SELECT DISTINCT fetched_at FROM currency_snapshots ORDER BY fetched_at ASC`)
    .all() as Array<{ fetched_at: number }>;
  return rows.map((r) => r.fetched_at);
}

export function getSummary(db: DatabaseSync) {
  const fetchedAt = getLatestFetchedAt(db);
  if (fetchedAt === null) return null;

  const league = (
    db.prepare(`SELECT league FROM currency_snapshots WHERE fetched_at = ? LIMIT 1`).get(
      fetchedAt,
    ) as { league: string } | undefined
  )?.league;

  const currencyRowCount = (
    db
      .prepare(`SELECT COUNT(*) as c FROM currency_snapshots WHERE fetched_at = ?`)
      .get(fetchedAt) as { c: number }
  ).c;

  const itemRowCount = (
    db.prepare(`SELECT COUNT(*) as c FROM item_snapshots WHERE fetched_at = ?`).get(fetchedAt) as {
      c: number;
    }
  ).c;

  const chaos = db
    .prepare(`SELECT primary_value FROM currency_snapshots WHERE fetched_at = ? AND item_id = 'chaos'`)
    .get(fetchedAt) as { primary_value: number } | undefined;

  const snapshotCount = getSnapshotTimestamps(db).length;

  return {
    league: league ?? null,
    fetchedAt,
    chaosPerDivine: chaos ? Math.round(1 / chaos.primary_value * 100) / 100 : null,
    divinePerChaos: chaos?.primary_value ?? null,
    currencyRowCount,
    itemRowCount,
    snapshotCount,
  };
}

export interface CurrencyLine {
  item_id: string;
  overview_type: string;
  primary_value: number;
  volume_primary_value: number | null;
  max_volume_currency: string | null;
  max_volume_rate: number | null;
  spark_total_change: number | null;
  sparkline_json: string | null;
}

export function getCurrencySnapshot(
  db: DatabaseSync,
  opts: { type?: string; fetchedAt: number },
): CurrencyLine[] {
  if (opts.type) {
    return db
      .prepare(
        `SELECT item_id, overview_type, primary_value, volume_primary_value,
                max_volume_currency, max_volume_rate, spark_total_change, sparkline_json
         FROM currency_snapshots WHERE fetched_at = ? AND overview_type = ?
         ORDER BY primary_value DESC`,
      )
      .all(opts.fetchedAt, opts.type) as CurrencyLine[];
  }
  return db
    .prepare(
      `SELECT item_id, overview_type, primary_value, volume_primary_value,
              max_volume_currency, max_volume_rate, spark_total_change, sparkline_json
       FROM currency_snapshots WHERE fetched_at = ?
       ORDER BY primary_value DESC`,
    )
    .all(opts.fetchedAt) as CurrencyLine[];
}

export function getCurrencyHistory(db: DatabaseSync, itemId: string) {
  return db
    .prepare(
      `SELECT fetched_at, primary_value, volume_primary_value
       FROM currency_snapshots WHERE item_id = ? ORDER BY fetched_at ASC`,
    )
    .all(itemId) as Array<{ fetched_at: number; primary_value: number; volume_primary_value: number | null }>;
}

export interface ItemLine {
  item_id: string;
  overview_type: string;
  details_id: string | null;
  name: string;
  base_type: string | null;
  category: string | null;
  level_required: number | null;
  primary_value: number;
  listing_count: number | null;
  corrupted: number;
  spark_total_change: number | null;
  sparkline_json: string | null;
  icon: string | null;
}

const ITEM_SORT_COLUMNS: Record<string, string> = {
  value: "primary_value",
  change: "spark_total_change",
  listings: "listing_count",
  name: "name",
};

export function getItemSnapshot(
  db: DatabaseSync,
  opts: {
    type?: string;
    fetchedAt: number;
    sort?: string;
    dir?: "asc" | "desc";
    limit?: number;
    maxListings?: number;
  },
): ItemLine[] {
  const sortCol = ITEM_SORT_COLUMNS[opts.sort ?? "value"] ?? "primary_value";
  const dir = opts.dir === "asc" ? "ASC" : "DESC";
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500);

  const conditions: string[] = ["fetched_at = ?"];
  const params: Array<string | number> = [opts.fetchedAt];
  if (opts.type) {
    conditions.push("overview_type = ?");
    params.push(opts.type);
  }
  if (opts.maxListings !== undefined) {
    conditions.push("listing_count IS NOT NULL AND listing_count <= ?");
    params.push(opts.maxListings);
  }
  params.push(limit);

  return db
    .prepare(
      `SELECT item_id, overview_type, details_id, name, base_type, category,
              level_required, primary_value, listing_count, corrupted,
              spark_total_change, sparkline_json, icon
       FROM item_snapshots
       WHERE ${conditions.join(" AND ")}
       ORDER BY ${sortCol} ${dir}
       LIMIT ?`,
    )
    .all(...params) as ItemLine[];
}

export function getItemHistory(db: DatabaseSync, itemId: string) {
  return db
    .prepare(
      `SELECT fetched_at, primary_value, listing_count
       FROM item_snapshots WHERE item_id = ? ORDER BY fetched_at ASC`,
    )
    .all(itemId) as Array<{ fetched_at: number; primary_value: number; listing_count: number | null }>;
}

/**
 * Conversion rates for the snapshot, derived from the stored `exalted` and
 * `chaos` currency lines (their primary_value is "divines per 1 unit").
 * PoE2 convention: exalted = common trade unit, chaos = mid tier, divine = high tier.
 */
export function getRates(db: DatabaseSync, fetchedAt: number) {
  const rows = db
    .prepare(
      `SELECT item_id, primary_value FROM currency_snapshots
       WHERE fetched_at = ? AND item_id IN ('exalted', 'chaos') AND overview_type = 'Currency'`,
    )
    .all(fetchedAt) as Array<{ item_id: string; primary_value: number }>;
  const exalted = rows.find((r) => r.item_id === "exalted")?.primary_value;
  const chaos = rows.find((r) => r.item_id === "chaos")?.primary_value;
  return {
    exaltedPerDivine: exalted ? 1 / exalted : null,
    chaosPerDivine: chaos ? 1 / chaos : null,
  };
}

/** Divine price expressed in exalted/chaos across every snapshot — the core inflation signal. */
export function getRatioHistory(db: DatabaseSync) {
  const rows = db
    .prepare(
      `SELECT fetched_at, item_id, primary_value FROM currency_snapshots
       WHERE item_id IN ('exalted', 'chaos') AND overview_type = 'Currency'
       ORDER BY fetched_at ASC`,
    )
    .all() as Array<{ fetched_at: number; item_id: string; primary_value: number }>;
  const byTime = new Map<number, { exaltedPerDivine?: number; chaosPerDivine?: number }>();
  for (const r of rows) {
    const entry = byTime.get(r.fetched_at) ?? {};
    if (r.item_id === "exalted") entry.exaltedPerDivine = 1 / r.primary_value;
    else entry.chaosPerDivine = 1 / r.primary_value;
    byTime.set(r.fetched_at, entry);
  }
  return [...byTime.entries()].map(([fetched_at, rates]) => ({ fetched_at, ...rates }));
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** Per-period swing sizes from a cumulative-% sparkline. */
function sparklineVolatility(sparklineJson: string | null): number {
  if (!sparklineJson) return 0;
  let points: number[];
  try {
    points = JSON.parse(sparklineJson);
  } catch {
    return 0;
  }
  if (!Array.isArray(points) || points.length < 3) return 0;
  const diffs = points.slice(1).map((p, i) => p - points[i]);
  return stddev(diffs);
}

export function getInsights(db: DatabaseSync, fetchedAt: number) {
  const rates = getRates(db, fetchedAt);

  const currencyBreadth = db
    .prepare(
      `SELECT
         SUM(CASE WHEN spark_total_change > 1 THEN 1 ELSE 0 END) as rising,
         SUM(CASE WHEN spark_total_change < -1 THEN 1 ELSE 0 END) as falling,
         SUM(CASE WHEN spark_total_change BETWEEN -1 AND 1 THEN 1 ELSE 0 END) as flat
       FROM currency_snapshots WHERE fetched_at = ?`,
    )
    .get(fetchedAt) as { rising: number; falling: number; flat: number };

  const itemBreadth = db
    .prepare(
      `SELECT
         SUM(CASE WHEN spark_total_change > 1 THEN 1 ELSE 0 END) as rising,
         SUM(CASE WHEN spark_total_change < -1 THEN 1 ELSE 0 END) as falling,
         SUM(CASE WHEN spark_total_change BETWEEN -1 AND 1 THEN 1 ELSE 0 END) as flat
       FROM item_snapshots WHERE fetched_at = ?`,
    )
    .get(fetchedAt) as { rising: number; falling: number; flat: number };

  const categoryPulse = db
    .prepare(
      `SELECT overview_type as type,
              COUNT(*) as count,
              ROUND(AVG(spark_total_change), 1) as avgChange,
              ROUND(SUM(volume_primary_value), 0) as totalVolume,
              SUM(CASE WHEN spark_total_change > 1 THEN 1 ELSE 0 END) as rising,
              SUM(CASE WHEN spark_total_change < -1 THEN 1 ELSE 0 END) as falling
       FROM currency_snapshots WHERE fetched_at = ?
       GROUP BY overview_type ORDER BY totalVolume DESC`,
    )
    .all(fetchedAt) as Array<{
    type: string;
    count: number;
    avgChange: number;
    totalVolume: number;
    rising: number;
    falling: number;
  }>;

  // Liquid movers only: volume >= 5 divine keeps out noise on dead markets.
  const gainers = db
    .prepare(
      `SELECT item_id, overview_type, primary_value, volume_primary_value,
              spark_total_change, sparkline_json
       FROM currency_snapshots
       WHERE fetched_at = ? AND volume_primary_value >= 5 AND spark_total_change > 0
       ORDER BY spark_total_change DESC LIMIT 8`,
    )
    .all(fetchedAt) as CurrencyLine[];

  const losers = db
    .prepare(
      `SELECT item_id, overview_type, primary_value, volume_primary_value,
              spark_total_change, sparkline_json
       FROM currency_snapshots
       WHERE fetched_at = ? AND volume_primary_value >= 5 AND spark_total_change < 0
       ORDER BY spark_total_change ASC LIMIT 8`,
    )
    .all(fetchedAt) as CurrencyLine[];

  const volumeLeaders = db
    .prepare(
      `SELECT item_id, overview_type, primary_value, volume_primary_value,
              spark_total_change, sparkline_json
       FROM currency_snapshots
       WHERE fetched_at = ? AND item_id != 'divine'
       ORDER BY volume_primary_value DESC LIMIT 10`,
    )
    .all(fetchedAt) as CurrencyLine[];

  const volatilityPool = db
    .prepare(
      `SELECT item_id, overview_type, primary_value, volume_primary_value,
              spark_total_change, sparkline_json
       FROM currency_snapshots
       WHERE fetched_at = ? AND volume_primary_value >= 5`,
    )
    .all(fetchedAt) as CurrencyLine[];
  const mostVolatile = volatilityPool
    .map((l) => ({ ...l, volatility: Math.round(sparklineVolatility(l.sparkline_json) * 10) / 10 }))
    .sort((a, b) => b.volatility - a.volatility)
    .slice(0, 8);

  const itemGainers = db
    .prepare(
      `SELECT item_id, name, category, overview_type, primary_value, listing_count,
              spark_total_change, sparkline_json, icon
       FROM item_snapshots
       WHERE fetched_at = ? AND listing_count >= 5 AND primary_value >= 0.5
             AND spark_total_change > 0
       ORDER BY spark_total_change DESC LIMIT 8`,
    )
    .all(fetchedAt);

  const itemLosers = db
    .prepare(
      `SELECT item_id, name, category, overview_type, primary_value, listing_count,
              spark_total_change, sparkline_json, icon
       FROM item_snapshots
       WHERE fetched_at = ? AND listing_count >= 5 AND primary_value >= 0.5
             AND spark_total_change < 0
       ORDER BY spark_total_change ASC LIMIT 8`,
    )
    .all(fetchedAt);

  return {
    fetchedAt,
    rates,
    ratioHistory: getRatioHistory(db),
    breadth: { currency: currencyBreadth, items: itemBreadth },
    categoryPulse,
    gainers,
    losers,
    volumeLeaders,
    mostVolatile,
    itemGainers,
    itemLosers,
  };
}

/**
 * Two distinct flip strategies, split by liquidity:
 *
 * - "Churn" (classic flipping): needs HIGH volume/liquidity so you can buy and
 *   resell fast. Currencies have real trade volume (from the in-game Currency
 *   Exchange); items only have listing counts as a liquidity proxy.
 * - "Snipe" (position trading): scarce items whose price is spiking. Big
 *   potential margins, but slow exits and prices set by very few listers.
 */
export function getFlipCandidates(
  db: DatabaseSync,
  opts: {
    fetchedAt: number;
    minChange?: number;
    maxListings?: number;
    minListings?: number;
    minVolume?: number;
    limit?: number;
  },
) {
  const minChange = opts.minChange ?? 20;
  const maxListings = opts.maxListings ?? 60;
  const minListings = opts.minListings ?? 30;
  const minVolume = opts.minVolume ?? 100;
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 200);

  // Currency churn: high-volume markets with real movement in either
  // direction (a dip in a liquid market is also a flip entry). Ranked by
  // volume — liquidity is the strategy here, movement is the trigger.
  const currencies = db
    .prepare(
      `SELECT 'currency' as kind, item_id, item_id as name, overview_type as category,
              primary_value, volume_primary_value, NULL as listing_count,
              spark_total_change, sparkline_json
       FROM currency_snapshots
       WHERE fetched_at = ? AND volume_primary_value >= ?
             AND ABS(spark_total_change) >= ?
             AND item_id NOT IN ('divine', 'exalted', 'chaos')
       ORDER BY volume_primary_value DESC
       LIMIT ?`,
    )
    .all(opts.fetchedAt, minVolume, minChange, limit);

  // Liquid item movers: plenty of listings (easy entry AND exit, trustworthy
  // price) + rising price. Value floor keeps out junk where the margin can't
  // cover trade friction.
  const liquidItems = db
    .prepare(
      `SELECT 'item' as kind, item_id, name, category, primary_value,
              listing_count, spark_total_change, sparkline_json, icon
       FROM item_snapshots
       WHERE fetched_at = ? AND listing_count IS NOT NULL AND listing_count >= ?
             AND spark_total_change >= ? AND primary_value >= 0.05
       ORDER BY spark_total_change DESC
       LIMIT ?`,
    )
    .all(opts.fetchedAt, minListings, minChange, limit);

  // Scarce snipes: the old thin-liquidity heuristic, kept but labeled
  // honestly — high risk, slow exit, price may be one lister's opinion.
  const items = db
    .prepare(
      `SELECT 'item' as kind, item_id, name, category, primary_value,
              listing_count, spark_total_change, sparkline_json, icon
       FROM item_snapshots
       WHERE fetched_at = ? AND listing_count IS NOT NULL AND listing_count <= ?
             AND spark_total_change >= ?
       ORDER BY spark_total_change DESC
       LIMIT ?`,
    )
    .all(opts.fetchedAt, maxListings, minChange, limit);

  return { items, liquidItems, currencies };
}
