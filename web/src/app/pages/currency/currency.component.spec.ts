import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CurrencyComponent } from './currency.component';

describe('CurrencyComponent', () => {
  let fixture: ComponentFixture<CurrencyComponent>;
  let component: CurrencyComponent;
  let httpMock: HttpTestingController;

  const mockMeta = {
    league: 'Settlers',
    currencyExchangeTypes: ['Currency', 'Fragment', 'Essence'],
    stashItemTypes: []
  };

  const mockCurrencyLines = [
    {
      item_id: 'divine',
      display_name: 'Divine Orb',
      overview_type: 'Currency',
      primary_value: 1,
      volume_primary_value: 10000,
      max_volume_currency: 'exalted',
      max_volume_rate: 46,
      spark_total_change: 0,
      sparkline: [1, 1, 1, 1, 1, 1, 1]
    },
    {
      item_id: 'exalted',
      display_name: 'Exalted Orb',
      overview_type: 'Currency',
      primary_value: 0.0217,
      volume_primary_value: 500000,
      max_volume_currency: 'chaos',
      max_volume_rate: 5,
      spark_total_change: -5.2,
      sparkline: [0.023, 0.022, 0.021, 0.02, 0.019, 0.021, 0.0217]
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // allow pending requests from cancelled takeUntilDestroyed
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load meta and currency on init', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/meta').flush(mockMeta);
    httpMock.expectOne('/api/currency?type=Currency').flush({ fetchedAt: 0, type: 'Currency', lines: mockCurrencyLines });
    fixture.detectChanges();

    expect(component.types).toEqual(['Currency', 'Fragment', 'Essence']);
    expect(component.lines.length).toBe(2);
  });

  it('should sort by volume descending by default', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/meta').flush(mockMeta);
    httpMock.expectOne('/api/currency?type=Currency').flush({ fetchedAt: 0, type: 'Currency', lines: mockCurrencyLines });
    fixture.detectChanges();

    // Higher volume first
    expect(component.lines[0].item_id).toBe('exalted');
    expect(component.lines[1].item_id).toBe('divine');
  });

  it('should filter by search query', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/meta').flush(mockMeta);
    httpMock.expectOne('/api/currency?type=Currency').flush({ fetchedAt: 0, type: 'Currency', lines: mockCurrencyLines });
    fixture.detectChanges();

    component.query = 'Divine';
    expect(component.visibleLines.length).toBe(1);
    expect(component.visibleLines[0].item_id).toBe('divine');
  });

  it('should reload on type change', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/meta').flush(mockMeta);
    httpMock.expectOne('/api/currency?type=Currency').flush({ fetchedAt: 0, type: 'Currency', lines: mockCurrencyLines });

    component.selectedType = 'Fragment';
    component.onTypeChange();
    httpMock.expectOne('/api/currency?type=Fragment').flush({ fetchedAt: 0, type: 'Fragment', lines: [] });
    expect(component.selected).toBeNull();
  });
});
