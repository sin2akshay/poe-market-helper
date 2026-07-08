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
  selector: 'app-sparkline',
  standalone: true,
  template: `<canvas #canvas width="100" height="28"></canvas>`,
  styles: [':host { display: inline-block; width: 100px; height: 28px; }']
})
export class SparklineComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: number[] = [];
  @Input() positive = true;

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(): void {
    this.render();
  }

  private render(): void {
    if (!this.canvasRef) return;
    this.chart?.destroy();
    const color = this.positive ? '#1baf7a' : '#e34948';
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.data.map((_, i) => String(i)),
        datasets: [
          {
            data: this.data,
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
