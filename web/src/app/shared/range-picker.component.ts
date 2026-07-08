import { Component, EventEmitter, Input, Output } from '@angular/core';

export type HistoryRange = '24h' | '7d' | '30d' | 'all';

export const RANGE_MS: Record<Exclude<HistoryRange, 'all'>, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000
};

export function filterByRange<T extends { fetched_at: number }>(
  points: T[],
  range: HistoryRange
): T[] {
  if (range === 'all') return points;
  const cutoff = Date.now() - RANGE_MS[range];
  return points.filter((p) => p.fetched_at >= cutoff);
}

@Component({
  selector: 'app-range-picker',
  standalone: true,
  template: `
    <div class="range-picker" role="group" aria-label="History time range">
      @for (r of ranges; track r) {
        <button type="button" [class.selected]="value === r" (click)="pick(r)">
          {{ r === 'all' ? 'All' : r }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .range-picker {
        display: inline-flex;
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: 7px;
        padding: 2px;
      }
      button {
        border: none;
        background: transparent;
        color: var(--text-muted);
        font-size: 11.5px;
        font-family: var(--font);
        padding: 3px 10px;
        border-radius: 5px;
        cursor: pointer;
      }
      button:hover {
        color: var(--text);
      }
      button.selected {
        background: var(--surface);
        color: var(--text);
        font-weight: 500;
      }
    `
  ]
})
export class RangePickerComponent {
  readonly ranges: HistoryRange[] = ['24h', '7d', '30d', 'all'];
  @Input() value: HistoryRange = 'all';
  @Output() valueChange = new EventEmitter<HistoryRange>();

  pick(r: HistoryRange): void {
    this.value = r;
    this.valueChange.emit(r);
  }
}
