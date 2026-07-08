import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG } from "./config.ts";
import {
  openDb,
  getLatestFetchedAt,
  getSummary,
  getCurrencySnapshot,
  getCurrencyHistory,
  getItemSnapshot,
  getItemHistory,
  getFlipCandidates,
  getRates,
  getInsights,
} from "./db.ts";

const PORT = Number(process.env.PORT ?? 4300);
const WEB_DIST = fileURLToPath(new URL("../web/dist/web", import.meta.url));
const ASSETS_DIR = fileURLToPath(new URL("../data/assets", import.meta.url));
const MANIFEST_PATH = join(ASSETS_DIR, "manifest.json");

const db = openDb();

// Icon manifest written by `npm run fetch-assets`; reloaded when its mtime
// changes so a re-fetch doesn't require a server restart.
interface AssetManifest {
  currency: Record<string, string>;
  urls: Record<string, string>;
  names?: Record<string, string>;
}
let manifest: AssetManifest = { currency: {}, urls: {} };
let manifestMtime = 0;

function getManifest(): AssetManifest {
  try {
    const mtime = statSync(MANIFEST_PATH).mtimeMs;
    if (mtime !== manifestMtime) {
      manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
      manifestMtime = mtime;
    }
  } catch {
    /* no manifest yet — icons simply stay null */
  }
  return manifest;
}

function localItemIcon(iconUrl: string | null): string | null {
  if (!iconUrl) return null;
  const filename = getManifest().urls[iconUrl];
  return filename ? `/assets/${filename}` : null;
}

function localCurrencyIcon(slug: string): string | null {
  const filename = getManifest().currency[slug];
  return filename ? `/assets/${filename}` : null;
}

/** Proper name from GGG metadata, falling back to title-cased slug. */
function currencyDisplayName(slug: string): string {
  const known = getManifest().names?.[slug];
  if (known) return known;
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Strips GGG tag markup: "Ezomyte [Wand]" -> "Ezomyte Wand", "[Sword|One Hand Sword]" -> "One Hand Sword". */
function cleanCategory(category: string | null): string | null {
  if (!category) return category;
  return category
    .replace(/\[([^\]|]+)\|([^\]]+)\]/g, "$2")
    .replace(/\[([^\]]+)\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function json(res: import("node:http").ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(payload);
}

function parseSparkline(json_: string | null): number[] {
  if (!json_) return [];
  try {
    return JSON.parse(json_);
  } catch {
    return [];
  }
}

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".woff2": "font/woff2",
};

async function serveStatic(res: import("node:http").ServerResponse, pathname: string) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  let filePath = join(WEB_DIST, safePath);
  if (!existsSync(filePath) || !filePath.startsWith(WEB_DIST)) {
    filePath = join(WEB_DIST, "index.html"); // Angular SPA fallback
  }
  if (!existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not built yet - run `npm run build:web` first, or use `npm run dev` for development.");
    return;
  }
  const body = await readFile(filePath);
  res.writeHead(200, { "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream" });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    const filename = url.pathname.slice("/assets/".length);
    const filePath = join(ASSETS_DIR, filename);
    if (!/^[a-f0-9]+\.(png|jpg|jpeg|webp|gif)$/i.test(filename) || !existsSync(filePath)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath)] ?? "image/png",
      "Cache-Control": "public, max-age=604800, immutable",
    });
    res.end(body);
    return;
  }

  if (!url.pathname.startsWith("/api/")) {
    return serveStatic(res, url.pathname);
  }

  try {
    const fetchedAtParam = url.searchParams.get("fetchedAt");
    const fetchedAt = fetchedAtParam ? Number(fetchedAtParam) : getLatestFetchedAt(db);

    if (url.pathname === "/api/meta") {
      return json(res, 200, {
        league: CONFIG.league,
        currencyExchangeTypes: CONFIG.currencyExchangeTypes,
        stashItemTypes: CONFIG.stashItemTypes,
      });
    }

    if (url.pathname === "/api/summary") {
      const summary = getSummary(db);
      if (!summary) return json(res, 404, { error: "No data yet - run `npm run ingest`." });
      const rates = getRates(db, summary.fetchedAt);
      return json(res, 200, { ...summary, ...rates });
    }

    // Enrichment: parse sparklines and swap icons for locally cached copies
    // (see fetch-assets.ts). Currency icons resolve by slug; item icons by
    // the stored source URL.
    const enrichCurrency = (l: any) => ({
      ...l,
      sparkline: parseSparkline(l.sparkline_json),
      icon: localCurrencyIcon(l.item_id),
      display_name: currencyDisplayName(l.item_id),
    });
    const enrichItem = (l: any) => ({
      ...l,
      sparkline: parseSparkline(l.sparkline_json),
      corrupted: l.corrupted !== undefined ? Boolean(l.corrupted) : undefined,
      icon: localItemIcon(l.icon),
      category: cleanCategory(l.category),
      base_type: l.base_type !== undefined ? cleanCategory(l.base_type) : undefined,
    });

    if (url.pathname === "/api/insights") {
      if (fetchedAt === null) return json(res, 404, { error: "No data yet" });
      const insights = getInsights(db, fetchedAt);
      return json(res, 200, {
        ...insights,
        gainers: insights.gainers.map(enrichCurrency),
        losers: insights.losers.map(enrichCurrency),
        volumeLeaders: insights.volumeLeaders.map(enrichCurrency),
        mostVolatile: insights.mostVolatile.map(enrichCurrency),
        itemGainers: (insights.itemGainers as any[]).map(enrichItem),
        itemLosers: (insights.itemLosers as any[]).map(enrichItem),
      });
    }

    if (url.pathname === "/api/currency") {
      if (fetchedAt === null) return json(res, 404, { error: "No data yet" });
      const type = url.searchParams.get("type") ?? undefined;
      const lines = getCurrencySnapshot(db, { type, fetchedAt }).map(enrichCurrency);
      return json(res, 200, { fetchedAt, type: type ?? "all", lines });
    }

    if (url.pathname === "/api/currency/history") {
      const id = url.searchParams.get("id");
      if (!id) return json(res, 400, { error: "id query param required" });
      return json(res, 200, { itemId: id, points: getCurrencyHistory(db, id) });
    }

    if (url.pathname === "/api/items") {
      if (fetchedAt === null) return json(res, 404, { error: "No data yet" });
      const type = url.searchParams.get("type") ?? undefined;
      const sort = url.searchParams.get("sort") ?? undefined;
      const dir = (url.searchParams.get("dir") as "asc" | "desc") ?? undefined;
      const limit = url.searchParams.get("limit")
        ? Number(url.searchParams.get("limit"))
        : undefined;
      const maxListings = url.searchParams.get("maxListings")
        ? Number(url.searchParams.get("maxListings"))
        : undefined;
      const lines = getItemSnapshot(db, { type, fetchedAt, sort, dir, limit, maxListings }).map(
        enrichItem,
      );
      return json(res, 200, { fetchedAt, type: type ?? "all", lines });
    }

    if (url.pathname === "/api/items/history") {
      const id = url.searchParams.get("id");
      if (!id) return json(res, 400, { error: "id query param required" });
      return json(res, 200, { itemId: id, points: getItemHistory(db, id) });
    }

    if (url.pathname === "/api/flips") {
      if (fetchedAt === null) return json(res, 404, { error: "No data yet" });
      const minChange = url.searchParams.get("minChange")
        ? Number(url.searchParams.get("minChange"))
        : undefined;
      const maxListings = url.searchParams.get("maxListings")
        ? Number(url.searchParams.get("maxListings"))
        : undefined;
      const minListings = url.searchParams.get("minListings")
        ? Number(url.searchParams.get("minListings"))
        : undefined;
      const minVolume = url.searchParams.get("minVolume")
        ? Number(url.searchParams.get("minVolume"))
        : undefined;
      const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined;
      const { items, liquidItems, currencies } = getFlipCandidates(db, {
        fetchedAt,
        minChange,
        maxListings,
        minListings,
        minVolume,
        limit,
      });
      return json(res, 200, {
        fetchedAt,
        items: (items as any[]).map(enrichItem),
        liquidItems: (liquidItems as any[]).map(enrichItem),
        currencies: (currencies as any[]).map(enrichCurrency),
      });
    }

    return json(res, 404, { error: "Unknown endpoint" });
  } catch (err) {
    console.error(err);
    return json(res, 500, { error: (err as Error).message });
  }
});

server.listen(PORT, () => {
  console.log(`PoE2 economy API + dashboard running at http://localhost:${PORT}`);
});
