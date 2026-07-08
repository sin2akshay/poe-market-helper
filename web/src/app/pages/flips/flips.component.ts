import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { DenomService } from '../../core/denom.service';
import { FlipCurrencyLine, FlipItemLine } from '../../core/models';
import { TypeNamePipe } from '../../core/type-name.pipe';
import { SparklineComponent } from '../../shared/sparkline.component';

@Component({
  selector: 'app-flips',
  standalone: true,
  imports: [CommonModule, FormsModule, SparklineComponent, TypeNamePipe],
  templateUrl: './flips.component.html',
  styleUrl: './flips.component.css'
})
export class FlipsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  minChange = 10;
  minVolume = 100;
  minListings = 30;
  maxListings = 60;

  query = '';
  currencies: FlipCurrencyLine[] = [];
  liquidItems: FlipItemLine[] = [];
  snipes: FlipItemLine[] = [];

  private matches(name: string, category: string | null): boolean {
    const q = this.query.trim().toLowerCase();
    if (!q) return true;
    return name.toLowerCase().includes(q) || (category ?? '').toLowerCase().includes(q);
  }

  get visibleCurrencies(): FlipCurrencyLine[] {
    return this.currencies.filter((l) => this.matches(l.display_name, l.category));
  }

  get visibleLiquidItems(): FlipItemLine[] {
    return this.liquidItems.filter((l) => this.matches(l.name, l.category));
  }

  get visibleSnipes(): FlipItemLine[] {
    return this.snipes.filter((l) => this.matches(l.name, l.category));
  }

  denom = inject(DenomService);
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api
      .getFlips({
        minChange: this.minChange,
        minVolume: this.minVolume,
        minListings: this.minListings,
        maxListings: this.maxListings,
        limit: 30
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.currencies = res.currencies;
          this.liquidItems = res.liquidItems;
          this.snipes = res.items;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message ?? 'Failed to load';
          this.loading = false;
        }
      });
  }

  fmtVolume(divine: number | null): string {
    if (divine === null) return '—';
    const v = this.denom.convert(divine) ?? 0;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
    return this.denom.formatNumber(v);
  }
}
