import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { DenomService } from '../../core/denom.service';
import { CurrencyLine, HistoryPoint, Meta } from '../../core/models';
import { TypeNamePipe } from '../../core/type-name.pipe';
import { SparklineComponent } from '../../shared/sparkline.component';
import { HistoryChartComponent } from '../../shared/history-chart.component';
import {
  HistoryRange,
  RangePickerComponent,
  filterByRange
} from '../../shared/range-picker.component';

type SortKey = 'display_name' | 'primary_value' | 'volume_primary_value' | 'spark_total_change';

@Component({
  selector: 'app-currency',
  standalone: true,
  imports: [CommonModule, FormsModule, SparklineComponent, HistoryChartComponent, RangePickerComponent, TypeNamePipe],
  templateUrl: './currency.component.html',
  styleUrl: './currency.component.css'
})
export class CurrencyComponent implements OnInit {
  loading = true;
  error: string | null = null;
  types: string[] = [];
  selectedType = 'Currency';
  lines: CurrencyLine[] = [];
  query = '';

  get visibleLines(): CurrencyLine[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.lines;
    return this.lines.filter(
      (l) => l.display_name.toLowerCase().includes(q) || l.item_id.includes(q)
    );
  }

  sortKey: SortKey = 'volume_primary_value';
  sortDir: 'asc' | 'desc' = 'desc';

  selected: CurrencyLine | null = null;
  history: HistoryPoint[] = [];
  historyRange: HistoryRange = 'all';

  get filteredHistory(): HistoryPoint[] {
    return filterByRange(this.history, this.historyRange);
  }

  denom = inject(DenomService);
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.api.getMeta()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((meta: Meta) => {
        this.types = meta.currencyExchangeTypes;
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getCurrency(this.selectedType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.lines = res.lines;
          this.applySort();
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message ?? 'Failed to load';
          this.loading = false;
        }
      });
  }

  onTypeChange(): void {
    this.selected = null;
    this.load();
  }

  sortBy(key: SortKey): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'desc';
    }
    this.applySort();
  }

  private applySort(): void {
    const dir = this.sortDir === 'asc' ? 1 : -1;
    this.lines = [...this.lines].sort((a, b) => {
      const av = a[this.sortKey] ?? 0;
      const bv = b[this.sortKey] ?? 0;
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * dir;
      }
      return ((av as number) - (bv as number)) * dir;
    });
  }

  arrow(key: SortKey): string {
    if (this.sortKey !== key) return '';
    return this.sortDir === 'asc' ? ' ▲' : ' ▼';
  }

  select(line: CurrencyLine): void {
    this.selected = line;
    this.history = [];
    this.api.getCurrencyHistory(line.item_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.history = res.points;
      });
  }
}
