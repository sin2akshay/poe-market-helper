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
  selector: 'app-sparkline',
  standalone: true,
  template: `<canvas #canvas width="100" height="28"></canvas>`,
  styles: [':host { display: inline-block; width: 100px; height: 28px; }']
})
export class SparklineComponent implements AfterViewInit, OnDestroy {
  data = input<number[]>([]);
  positive = input(true);

  canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    effect(() => {
      this.render(this.data(), this.positive());
    });
  }

  ngAfterViewInit(): void {
    this.render(this.data(), this.positive());
  }

  private render(data: number[], positive: boolean): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    this.chart?.destroy();
    const color = positive ? '#1baf7a' : '#e34948';
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((_, i) => String(i)),
        datasets: [
          {
            data,
            borderColor: color,
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.3,
            fill: false
          }
        ]
      },
      options: {
        responsive: false,
        animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { line: { borderJoinStyle: 'round' } }
      }
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
