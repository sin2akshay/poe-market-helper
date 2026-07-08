import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  viewChild
} from '@angular/core';
import { Chart } from 'chart.js';
import { HistoryPoint } from '../core/models';

@Component({
  selector: 'app-history-chart',
  standalone: true,
  template: `
    <div style="position: relative; height: 220px;">
      <canvas #canvas role="img" [attr.aria-label]="'Price history for ' + label()"></canvas>
    </div>
  `
})
export class HistoryChartComponent implements AfterViewInit, OnDestroy {
  points = input<HistoryPoint[]>([]);
  label = input('');

  canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    effect(() => {
      this.render(this.points(), this.label());
    });
  }

  ngAfterViewInit(): void {
    this.render(this.points(), this.label());
  }

  private render(points: HistoryPoint[], label: string): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    this.chart?.destroy();
    if (points.length === 0) return;

    const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const axisColor = isDark ? '#c3c2b7' : '#898781';
    const gridColor = isDark ? '#2c2c2a' : '#e1e0d9';

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: points.map((p) => new Date(p.fetched_at).toLocaleString()),
        datasets: [
          {
            label,
            data: points.map((p) => p.primary_value),
            borderColor: '#2a78d6',
            backgroundColor: 'rgba(42,120,214,0.1)',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.25,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: axisColor, maxRotation: 0 }, grid: { display: false } },
          y: { ticks: { color: axisColor }, grid: { color: gridColor } }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
