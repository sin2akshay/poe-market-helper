import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OverviewComponent } from './overview.component';
import { Insights, Summary } from '../../core/models';

describe('OverviewComponent', () => {
  let fixture: ComponentFixture<OverviewComponent>;
  let component: OverviewComponent;
  let httpMock: HttpTestingController;

  const mockSummary: Summary = {
    league: 'Settlers',
    fetchedAt: 1700000000000,
    chaosPerDivine: 230,
    divinePerChaos: 0.0043,
    exaltedPerDivine: 46,
    currencyRowCount: 14,
    itemRowCount: 500,
    snapshotCount: 5
  };

  const mockInsights: Insights = {
    fetchedAt: 1700000000000,
    rates: { exaltedPerDivine: 46, chaosPerDivine: 230 },
    ratioHistory: [],
    breadth: { currency: { rising: 5, falling: 3, flat: 2 }, items: { rising: 10, falling: 8, flat: 4 } },
    categoryPulse: [],
    gainers: [],
    losers: [],
    volumeLeaders: [],
    mostVolatile: [],
    itemGainers: [],
    itemLosers: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(OverviewComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // allow pending requests from cancelled takeUntilDestroyed subscriptions
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading initially', () => {
    fixture.detectChanges();
    expect(component.loading).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Loading');
    // flush pending requests
    httpMock.expectOne('/api/summary').flush(mockSummary);
    httpMock.expectOne('/api/insights').flush(mockInsights);
  });

  it('should load summary and insights on init', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/summary').flush(mockSummary);
    httpMock.expectOne('/api/insights').flush(mockInsights);
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.summary?.league).toBe('Settlers');
    expect(component.insights?.rates.exaltedPerDivine).toBe(46);
  });

  it('should handle missing data gracefully', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/summary').flush(mockSummary);
    httpMock.expectOne('/api/insights').flush(mockInsights);
    fixture.detectChanges();

    expect(component.divineTrendPct).toBeNull(); // only 1 snapshot in ratioHistory
  });
});
