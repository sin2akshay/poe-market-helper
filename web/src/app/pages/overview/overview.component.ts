import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { DenomService } from '../../core/denom.service';
import { Insights, Summary } from '../../core/models';
import { TypeNamePipe } from '../../core/type-name.pipe';
import { SparklineComponent } from '../../shared/sparkline.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, SparklineComponent, TypeNamePipe],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent implements OnInit {
  loading = true;
  error: string | null = null;
  summary?: Summary;
  insights?: Insights;

  denom = inject(DenomService);
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    forkJoin({
      summary: this.api.getSummary(),
      insights: this.api.getInsights()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ summary, insights }) => {
          this.summary = summary;
          this.insights = insights;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message ?? 'Failed to load data';
          this.loading = false;
        }
      });
  }

  get lastUpdated(): string {
    return this.summary ? new Date(this.summary.fetchedAt).toLocaleString() : '—';
  }

  /** % move of the divine's exalted price across collected snapshots. */
  get divineTrendPct(): number | null {
    const h = this.insights?.ratioHistory ?? [];
    const pts = h.filter((p) => p.exaltedPerDivine !== undefined);
    if (pts.length < 2) return null;
    const first = pts[0].exaltedPerDivine!;
    const last = pts[pts.length - 1].exaltedPerDivine!;
    return ((last - first) / first) * 100;
  }

  breadthPct(rising: number, falling: number, flat: number): { up: number; down: number } {
    const total = rising + falling + flat;
    if (total === 0) return { up: 0, down: 0 };
    return { up: (rising / total) * 100, down: (falling / total) * 100 };
  }

  fmtVolume(divine: number | null): string {
    if (divine === null) return '—';
    const v = this.denom.convert(divine) ?? 0;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
    return this.denom.formatNumber(v);
  }

  trackById(_: number, line: { item_id: string }): string {
    return line.item_id;
  }
}
