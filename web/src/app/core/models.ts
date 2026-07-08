export interface Summary {
  league: string | null;
  fetchedAt: number;
  chaosPerDivine: number | null;
  divinePerChaos: number | null;
  exaltedPerDivine: number | null;
  currencyRowCount: number;
  itemRowCount: number;
  snapshotCount: number;
}

export interface Breadth {
  rising: number;
  falling: number;
  flat: number;
}

export interface CategoryPulse {
  type: string;
  count: number;
  avgChange: number;
  totalVolume: number;
  rising: number;
  falling: number;
}

export interface InsightCurrencyLine {
  item_id: string;
  icon: string | null;
  display_name: string;
  overview_type: string;
  primary_value: number;
  volume_primary_value: number | null;
  spark_total_change: number | null;
  sparkline: number[];
  volatility?: number;
}

export interface InsightItemLine {
  item_id: string;
  icon: string | null;
  name: string;
  category: string | null;
  overview_type: string;
  primary_value: number;
  listing_count: number | null;
  spark_total_change: number | null;
  sparkline: number[];
}

export interface RatioPoint {
  fetched_at: number;
  exaltedPerDivine?: number;
  chaosPerDivine?: number;
}

export interface Insights {
  fetchedAt: number;
  rates: { exaltedPerDivine: number | null; chaosPerDivine: number | null };
  ratioHistory: RatioPoint[];
  breadth: { currency: Breadth; items: Breadth };
  categoryPulse: CategoryPulse[];
  gainers: InsightCurrencyLine[];
  losers: InsightCurrencyLine[];
  volumeLeaders: InsightCurrencyLine[];
  mostVolatile: InsightCurrencyLine[];
  itemGainers: InsightItemLine[];
  itemLosers: InsightItemLine[];
}

export interface CurrencyLine {
  item_id: string;
  icon: string | null;
  display_name: string;
  overview_type: string;
  primary_value: number;
  volume_primary_value: number | null;
  max_volume_currency: string | null;
  max_volume_rate: number | null;
  spark_total_change: number | null;
  sparkline: number[];
}

export interface CurrencyResponse {
  fetchedAt: number;
  type: string;
  lines: CurrencyLine[];
}

export interface ItemLine {
  item_id: string;
  icon: string | null;
  overview_type: string;
  details_id: string | null;
  name: string;
  base_type: string | null;
  category: string | null;
  level_required: number | null;
  primary_value: number;
  listing_count: number | null;
  corrupted: boolean;
  spark_total_change: number | null;
  sparkline: number[];
}

export interface ItemResponse {
  fetchedAt: number;
  type: string;
  lines: ItemLine[];
}

export interface FlipCurrencyLine {
  kind: 'currency';
  item_id: string;
  icon: string | null;
  display_name: string;
  name: string;
  category: string;
  primary_value: number;
  volume_primary_value: number | null;
  listing_count: null;
  spark_total_change: number;
  sparkline: number[];
}

export interface FlipItemLine {
  kind: 'item';
  item_id: string;
  icon: string | null;
  name: string;
  category: string;
  primary_value: number;
  listing_count: number;
  spark_total_change: number;
  sparkline: number[];
}

export interface FlipsResponse {
  fetchedAt: number;
  items: FlipItemLine[];
  liquidItems: FlipItemLine[];
  currencies: FlipCurrencyLine[];
}

export interface HistoryPoint {
  fetched_at: number;
  primary_value: number;
  volume_primary_value?: number | null;
  listing_count?: number | null;
}

export interface Meta {
  league: string | null;
  currencyExchangeTypes: string[];
  stashItemTypes: string[];
}
