// Response shapes for https://poe.ninja/poe2/api/economy, verified live 2026-07-07.
// Undocumented beyond poe.ninja's own /docs/api page - fields may change without notice.

export interface League {
  id: string;
  name: string;
}

export interface EconomyCore {
  items: Array<{
    id: string;
    name: string;
    image: string;
    category: string;
    detailsId: string;
  }>;
  rates: Record<string, number>;
  primary: string;
  secondary: string;
}

export interface Sparkline {
  totalChange: number;
  data: number[];
}

export interface CurrencyExchangeLine {
  id: string;
  primaryValue: number;
  volumePrimaryValue: number;
  maxVolumeCurrency: string;
  maxVolumeRate: number;
  sparkline: Sparkline;
}

export interface CurrencyExchangeOverview {
  core: EconomyCore;
  lines: CurrencyExchangeLine[];
}

export interface ItemModifier {
  text: string;
  optional: boolean;
}

export interface StashItemLine {
  id: number;
  itemId: string;
  detailsId: string;
  name: string;
  baseType: string;
  icon: string;
  flavourText?: string;
  levelRequired: number;
  category: string;
  primaryValue: number;
  listingCount: number;
  corrupted: boolean;
  sparkLine: Sparkline;
  implicitModifiers?: ItemModifier[];
  explicitModifiers?: ItemModifier[];
  variant?: string;
}

export interface StashItemOverview {
  core: EconomyCore;
  lines: StashItemLine[];
}
