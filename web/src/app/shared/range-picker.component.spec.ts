import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RangePickerComponent, HistoryRange } from './range-picker.component';

describe('RangePickerComponent', () => {
  let fixture: ComponentFixture<RangePickerComponent>;
  let component: RangePickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RangePickerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RangePickerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have four range options', () => {
    expect(component.ranges).toEqual(['24h', '7d', '30d', 'all']);
  });

  it('defaults to all range', () => {
    expect(component.value()).toBe('all');
  });

  it('renders four buttons', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(4);
    expect(buttons[0].textContent?.trim()).toBe('24h');
    expect(buttons[3].textContent?.trim()).toBe('All');
  });

  it('marks all as selected by default', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[3].classList.contains('selected')).toBeTrue();
  });

  it('emits valueChange on button click', () => {
    const emitted: HistoryRange[] = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[0] as HTMLButtonElement).click();

    expect(emitted).toEqual(['24h']);
  });
});
