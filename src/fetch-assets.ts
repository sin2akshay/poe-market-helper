// Downloads game-art icons locally so the dashboard doesn't hotlink CDNs.
//
// Sources (both are the original GGG art):
// - Unique item icons: full poecdn URLs already present in poe.ninja's item
//   overview data (stored in item_snapshots.icon at ingest).
// - Currency icons: one-time fetch of the trade site's public static metadata
//   JSON (the same file every trade-site visitor's browser loads). This is a
//   single anonymous GET for metadata, not scraping or polling.
//
// Files land in data/assets/<sha1(url)>.<ext>; data/assets/manifest.json maps
// currency slugs -> filename and raw URLs -> filename. Re-runs only download
// what's missing.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { openDb, getLatestFetchedAt } from "./db.ts";
import { CONFIG } from "./config.ts";

const ASSETS_DIR = fileURLToPath(new URL("../data/assets", import.meta.url));
const MANIFEST_PATH = join(ASSETS_DIR, "manifest.json");
const POECDN = "https://web.poecdn.com";
const TRADE_STATIC_URL = "https://www.pathofexile.com/api/trade2/data/static";

interface Manifest {
  currency: Record<string, string>; // poe.ninja slug -> filename
  urls: Record<string, string>; // absolute source URL -> filename
  names: Record<string, string>; // poe.ninja slug -> proper display name
}

function loadManifest(): Manifest {
  if (existsSync(MANIFEST_PATH)) {
    try {
      const parsed = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
      return { currency: {}, urls: {}, names: {}, ...parsed };
    } catch {
      /* corrupt manifest -> rebuild */
    }
  }
  return { currency: {}, urls: {}, names: {} };
}

function urlToFilename(url: string): string {
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 16);
  const extMatch = /\.(png|jpg|jpeg|webp|gif)(\?|$)/i.exec(url);
  const ext = extMatch ? extMatch[1].toLowerCase() : "png";
  return `${hash}.${ext}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function download(url: string, filename: string): Promise<boolean> {
  const dest = join(ASSETS_DIR, filename);
  if (existsSync(dest)) return false;
  const res = await fetch(url, { headers: { "User-Agent": CONFIG.userAgent } });
  if (!res.ok) {
    console.warn(`  skip ${url} (${res.status})`);
    return false;
  }
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return true;
}

async function downloadAll(
  entries: Array<{ url: string; filename: string }>,
  concurrency = 4,
): Promise<number> {
  let downloaded = 0;
  let index = 0;
  async function worker() {
    while (index < entries.length) {
      const entry = entries[index++];
      try {
        if (await download(entry.url, entry.filename)) downloaded++;
      } catch (err) {
        console.warn(`  failed ${entry.url}: ${(err as Error).message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return downloaded;
}

async function main() {
  mkdirSync(ASSETS_DIR, { recursive: true });
  const manifest = loadManifest();
  const db = openDb();
  const fetchedAt = getLatestFetchedAt(db);
  if (fetchedAt === null) {
    console.error("No data yet - run `npm run ingest` first.");
    process.exitCode = 1;
    return;
  }

  // --- Unique item icons (from the latest snapshot's stored poecdn URLs) ---
  const itemIcons = db
    .prepare(
      `SELECT DISTINCT icon FROM item_snapshots
       WHERE fetched_at = ? AND icon IS NOT NULL AND icon != ''`,
    )
    .all(fetchedAt) as Array<{ icon: string }>;
  db.close();

  const itemEntries = itemIcons.map(({ icon }) => {
    const filename = urlToFilename(icon);
    manifest.urls[icon] = filename;
    return { url: icon, filename };
  });
  console.log(`Item icons: ${itemEntries.length} referenced in latest snapshot`);
  const itemsDownloaded = await downloadAll(itemEntries);
  console.log(`  downloaded ${itemsDownloaded} new (rest already cached)`);

  // --- Currency icons (one-time static metadata fetch) ---
  console.log("Currency icons: fetching trade static metadata…");
  try {
    const res = await fetch(TRADE_STATIC_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (personal PoE2 economy dashboard; one-time asset fetch)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      result: Array<{ id: string; entries: Array<{ id: string; text: string; image?: string }> }>;
    };
    const currencyEntries: Array<{ url: string; filename: string }> = [];
    for (const group of data.result) {
      for (const entry of group.entries) {
        if (!entry.image) continue;
        const url = entry.image.startsWith("http") ? entry.image : POECDN + entry.image;
        const filename = urlToFilename(url);
        // Trade entry.id is the canonical slug poe.ninja reuses ('divine',
        // 'annul', 'fracturing-orb'); slugified display text as fallback alias.
        manifest.currency[entry.id] = filename;
        manifest.names[entry.id] = entry.text;
        const alias = slugify(entry.text);
        if (!(alias in manifest.currency)) manifest.currency[alias] = filename;
        if (!(alias in manifest.names)) manifest.names[alias] = entry.text;
        manifest.urls[url] = filename;
        currencyEntries.push({ url, filename });
      }
    }
    console.log(`  ${currencyEntries.length} currency images referenced`);
    const currencyDownloaded = await downloadAll(currencyEntries);
    console.log(`  downloaded ${currencyDownloaded} new (rest already cached)`);
  } catch (err) {
    console.warn(`  currency metadata fetch failed: ${(err as Error).message}`);
    console.warn("  item icons still work; re-run later for currency icons.");
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Manifest written: ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error("Asset fetch failed:", err);
  process.exitCode = 1;
});
