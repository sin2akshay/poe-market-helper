import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  template: `
    <div [style.height.px]="height">
      <canvas #canvas [attr.role]="'img'" [attr.aria-label]="ariaLabel"></canvas>
    </div>
  `
})
export class BarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() labels: string[] = [];
  @Input() values: number[] = [];
  @Input() ariaLabel = 'Bar chart';
  @Input() height = 260;
  @Input() suffix = '%';

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(): void {
    this.render();
  }

  private render(): void {
    if (!this.canvasRef || this.labels.length === 0) return;
    this.chart?.destroy();
    const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const axisColor = isDark ? '#c3c2b7' : '#898781';
    const gridColor = isDark ? '#2c2c2a' : '#e1e0d9';

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.labels,
        datasets: [
          {
            data: this.values,
            backgroundColor: this.values.map((v) => (v >= 0 ? '#2a78d6' : '#e34948')),
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
                return `${x >= 0 ? '+' : ''}${x.toFixed(1)}${this.suffix}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: axisColor, callback: (v) => `${v}${this.suffix}` },
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
