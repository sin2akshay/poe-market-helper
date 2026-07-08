import { CONFIG } from "./config.ts";
import { openDb, insertCurrencySnapshots, insertItemSnapshots } from "./db.ts";
import {
  fetchCurrencyExchangeOverview,
  fetchStashItemOverview,
  pickDefaultLeague,
} from "./poeninja/client.ts";

async function main() {
  const league = CONFIG.league ?? (await pickDefaultLeague());
  const fetchedAt = Date.now();
  console.log(`Ingesting poe.ninja PoE2 economy snapshot for league "${league}"`);

  const db = openDb();

  for (const type of CONFIG.currencyExchangeTypes) {
    try {
      const overview = await fetchCurrencyExchangeOverview(league, type);
      insertCurrencySnapshots(
        db,
        overview.lines.map((line) => ({
          fetchedAt,
          league,
          overviewType: type,
          itemId: line.id,
          primaryValue: line.primaryValue,
          volumePrimaryValue: line.volumePrimaryValue ?? null,
          maxVolumeCurrency: line.maxVolumeCurrency ?? null,
          maxVolumeRate: line.maxVolumeRate ?? null,
          sparkTotalChange: line.sparkline?.totalChange ?? null,
          sparklineJson: line.sparkline ? JSON.stringify(line.sparkline.data) : null,
        })),
      );
      console.log(`  currency/${type}: ${overview.lines.length} rows`);
    } catch (err) {
      console.error(`  currency/${type} failed:`, (err as Error).message);
    }
  }

  for (const type of CONFIG.stashItemTypes) {
    try {
      const overview = await fetchStashItemOverview(league, type);
      insertItemSnapshots(
        db,
        overview.lines.map((line) => ({
          fetchedAt,
          league,
          overviewType: type,
          itemId: line.itemId,
          detailsId: line.detailsId ?? null,
          name: line.name,
          baseType: line.baseType ?? null,
          category: line.category ?? null,
          levelRequired: line.levelRequired ?? null,
          primaryValue: line.primaryValue,
          listingCount: line.listingCount ?? null,
          corrupted: Boolean(line.corrupted),
          sparkTotalChange: line.sparkLine?.totalChange ?? null,
          sparklineJson: line.sparkLine ? JSON.stringify(line.sparkLine.data) : null,
          icon: line.icon ?? null,
        })),
      );
      console.log(`  item/${type}: ${overview.lines.length} rows`);
    } catch (err) {
      console.error(`  item/${type} failed:`, (err as Error).message);
    }
  }

  db.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exitCode = 1;
});
