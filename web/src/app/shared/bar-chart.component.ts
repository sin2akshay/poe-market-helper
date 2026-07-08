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

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  template: `
    <div [style.height.px]="height()">
      <canvas #canvas [attr.role]="'img'" [attr.aria-label]="ariaLabel()"></canvas>
    </div>
  `
})
export class BarChartComponent implements AfterViewInit, OnDestroy {
  labels = input<string[]>([]);
  values = input<number[]>([]);
  ariaLabel = input('Bar chart');
  height = input(260);
  suffix = input('%');

  canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    effect(() => {
      // Depend on all signals so the chart re-renders on any change
      this.render(
        this.labels(),
        this.values(),
        this.ariaLabel(),
        this.height(),
        this.suffix()
      );
    });
  }

  ngAfterViewInit(): void {
    this.render(
      this.labels(),
      this.values(),
      this.ariaLabel(),
      this.height(),
      this.suffix()
    );
  }

  private render(
    labels: string[],
    values: number[],
    ariaLabel: string,
    height: number,
    suffix: string
  ): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || labels.length === 0) return;
    this.chart?.destroy();
    const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const axisColor = isDark ? '#c3c2b7' : '#898781';
    const gridColor = isDark ? '#2c2c2a' : '#e1e0d9';

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: values.map((v) => (v >= 0 ? '#2a78d6' : '#e34948')),
            borderRadius: 4,
            barThickness: 18
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const x = ctx.parsed.x ?? 0;
                return `${x >= 0 ? '+' : ''}${x.toFixed(1)}${suffix}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: axisColor, callback: (v) => `${v}${suffix}` },
            grid: { color: gridColor }
          },
          y: { ticks: { color: axisColor }, grid: { display: false } }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
