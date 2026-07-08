import { Injectable, computed, signal } from '@angular/core';

export type Denom = 'divine' | 'chaos' | 'exalted';

const SUFFIX: Record<Denom, string> = {
  divine: 'div',
  chaos: 'c',
  exalted: 'ex'
};

/**
 * Global display denomination. All values are stored in divine orbs;
 * this service converts for display. PoE2 convention: exalted is the
 * everyday trade currency, chaos mid-tier, divine the high-value standard.
 */
@Injectable({ providedIn: 'root' })
export class DenomService {
  readonly denom = signal<Denom>('exalted');
  readonly chaosPerDivine = signal<number | null>(null);
  readonly exaltedPerDivine = signal<number | null>(null);

  readonly rate = computed(() => {
    switch (this.denom()) {
      case 'chaos':
        return this.chaosPerDivine() ?? 1;
      case 'exalted':
        return this.exaltedPerDivine() ?? 1;
      default:
        return 1;
    }
  });

  readonly suffix = computed(() => SUFFIX[this.denom()]);

  setRates(rates: { chaosPerDivine: number | null; exaltedPerDivine: number | null }): void {
    this.chaosPerDivine.set(rates.chaosPerDivine);
    this.exaltedPerDivine.set(rates.exaltedPerDivine);
  }

  set(denom: Denom): void {
    this.denom.set(denom);
  }

  convert(divineValue: number | null | undefined): number | null {
    if (divineValue === null || divineValue === undefined) return null;
    return divineValue * this.rate();
  }

  /** Smart-precision display: "7,704 div", "63.9 ex", "0.083 ex". */
  format(divineValue: number | null | undefined): string {
    const v = this.convert(divineValue);
    if (v === null) return '—';
    return `${this.formatNumber(v)} ${this.suffix()}`;
  }

  formatNumber(v: number): string {
    const abs = Math.abs(v);
    if (abs >= 1000) return Math.round(v).toLocaleString();
    if (abs >= 100) return v.toFixed(0);
    if (abs >= 10) return v.toFixed(1);
    if (abs >= 1) return v.toFixed(2);
    if (abs >= 0.01) return v.toFixed(3);
    if (abs === 0) return '0';
    return v.toPrecision(2);
  }
}
