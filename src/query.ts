// Quick sanity-check report over the latest ingested snapshot.
// Run: npm run query
import { openDb } from "./db.ts";

const db = openDb();

const latest = db
  .prepare(`SELECT MAX(fetched_at) as t FROM currency_snapshots`)
  .get() as { t: number | null };

if (!latest.t) {
  console.log("No data yet - run `npm run ingest` first.");
  process.exit(0);
}

console.log(`Latest snapshot: ${new Date(latest.t).toISOString()}\n`);

console.log("Top 10 currency movers (by sparkline totalChange %):");
for (const row of db
  .prepare(
    `SELECT item_id, primary_value, volume_primary_value, spark_total_change
     FROM currency_snapshots
     WHERE fetched_at = ?
     ORDER BY ABS(spark_total_change) DESC
     LIMIT 10`,
  )
  .all(latest.t) as Array<{
  item_id: string;
  primary_value: number;
  volume_primary_value: number;
  spark_total_change: number;
}>) {
  console.log(
    `  ${row.item_id.padEnd(30)} ${row.spark_total_change > 0 ? "+" : ""}${row.spark_total_change.toFixed(1)}%  ` +
      `value=${row.primary_value}  volume=${row.volume_primary_value}`,
  );
}

console.log("\nTop 10 rising unique items with thin liquidity (possible flip candidates):");
for (const row of db
  .prepare(
    `SELECT name, category, primary_value, listing_count, spark_total_change
     FROM item_snapshots
     WHERE fetched_at = ? AND listing_count IS NOT NULL AND listing_count < 50
     ORDER BY spark_total_change DESC
     LIMIT 10`,
  )
  .all(latest.t) as Array<{
  name: string;
  category: string;
  primary_value: number;
  listing_count: number;
  spark_total_change: number;
}>) {
  console.log(
    `  ${row.name.padEnd(30)} +${row.spark_total_change.toFixed(1)}%  ` +
      `value=${row.primary_value}  listings=${row.listing_count}  (${row.category})`,
  );
}

db.close();
