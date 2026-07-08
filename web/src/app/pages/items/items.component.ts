import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { DenomService } from '../../core/denom.service';
import { HistoryPoint, ItemLine, Meta } from '../../core/models';
import { TypeNamePipe } from '../../core/type-name.pipe';
import { SparklineComponent } from '../../shared/sparkline.component';
import { HistoryChartComponent } from '../../shared/history-chart.component';
import {
  HistoryRange,
  RangePickerComponent,
  filterByRange
} from '../../shared/range-picker.component';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule, SparklineComponent, HistoryChartComponent, RangePickerComponent, TypeNamePipe],
  templateUrl: './items.component.html',
  styleUrl: './items.component.css'
})
export class ItemsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  types: string[] = [];
  selectedType = 'UniqueWeapons';
  sort: 'value' | 'change' | 'listings' | 'name' = 'value';
  dir: 'asc' | 'desc' = 'desc';
  maxListings: number | null = null;

  query = '';
  lines: ItemLine[] = [];

  get visibleLines(): ItemLine[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.lines;
    return this.lines.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.base_type ?? '').toLowerCase().includes(q) ||
        (l.category ?? '').toLowerCase().includes(q)
    );
  }
  selected: ItemLine | null = null;
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
      this.types = meta.stashItemTypes;
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api
      .getItems({
        type: this.selectedType,
        sort: this.sort,
        dir: this.dir,
        limit: 500,
        maxListings: this.maxListings ?? undefined
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.lines = res.lines;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message ?? 'Failed to load';
          this.loading = false;
        }
      });
  }

  sortBy(key: 'value' | 'change' | 'listings' | 'name'): void {
    if (this.sort === key) {
      this.dir = this.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sort = key;
      this.dir = 'desc';
    }
    this.load();
  }

  arrow(key: 'value' | 'change' | 'listings' | 'name'): string {
    if (this.sort !== key) return '';
    return this.dir === 'asc' ? ' ▲' : ' ▼';
  }

  select(line: ItemLine): void {
    this.selected = line;
    this.history = [];
    this.api.getItemHistory(line.item_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.history = res.points;
      });
  }
}
