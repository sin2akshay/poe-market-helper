import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chart, CategoryScale, LinearScale, LineController, PointElement, LineElement } from 'chart.js';
import { SparklineComponent } from './sparkline.component';

// Register required Chart.js components for tests
Chart.register(CategoryScale, LinearScale, LineController, PointElement, LineElement);

describe('SparklineComponent', () => {
  let fixture: ComponentFixture<SparklineComponent>;
  let component: SparklineComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SparklineComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SparklineComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render canvas element', () => {
    fixture.componentRef.setInput('data', [1, 2, 3]);
    fixture.componentRef.setInput('positive', true);
    fixture.detectChanges();
    const canvas = fixture.nativeElement.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('accepts positive/negative signal input', () => {
    fixture.componentRef.setInput('data', [5, 3, 1]);
    fixture.componentRef.setInput('positive', false);
    fixture.detectChanges();
    expect(component.positive()).toBeFalse();
  });
});
