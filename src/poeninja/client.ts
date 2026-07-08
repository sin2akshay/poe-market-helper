import { CONFIG } from "../config.ts";
import type {
  CurrencyExchangeOverview,
  League,
  StashItemOverview,
} from "./types.ts";

const BASE = "https://poe.ninja/poe2/api/economy";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": CONFIG.userAgent },
  });
  if (!res.ok) {
    throw new Error(`poe.ninja request failed: ${res.status} ${res.statusText} (${url})`);
  }
  return (await res.json()) as T;
}

export function fetchLeagues(): Promise<League[]> {
  return getJson(`${BASE}/leagues`);
}

export function fetchCurrencyExchangeOverview(
  league: string,
  type: string,
): Promise<CurrencyExchangeOverview> {
  const url = `${BASE}/exchange/current/overview?league=${encodeURIComponent(league)}&type=${encodeURIComponent(type)}`;
  return getJson(url);
}

export function fetchStashItemOverview(
  league: string,
  type: string,
): Promise<StashItemOverview> {
  const url = `${BASE}/stash/current/item/overview?league=${encodeURIComponent(league)}&type=${encodeURIComponent(type)}`;
  return getJson(url);
}

/** Picks the current softcore challenge league (excludes Standard/Hardcore/HC variants). */
export async function pickDefaultLeague(): Promise<string> {
  const leagues = await fetchLeagues();
  const challenge = leagues.find(
    (l) => l.name !== "Standard" && l.name !== "Hardcore" && !l.name.startsWith("HC "),
  );
  if (!challenge) {
    throw new Error("Could not find a current challenge league in poe.ninja's league list");
  }
  return challenge.name;
}
