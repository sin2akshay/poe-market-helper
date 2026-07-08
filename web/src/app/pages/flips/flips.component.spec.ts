import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FlipsComponent } from './flips.component';

describe('FlipsComponent', () => {
  let fixture: ComponentFixture<FlipsComponent>;
  let component: FlipsComponent;
  let httpMock: HttpTestingController;

  const mockFlips = {
    fetchedAt: 1700000000000,
    currencies: [{
      item_id: 'exalted', display_name: 'Exalted Orb', category: 'Currency',
      overview_type: 'Currency', primary_value: 1, volume_primary_value: 5000,
      spark_total_change: 15, sparkline: []
    }],
    liquidItems: [{
      item_id: 'test item', name: 'Test Unique', category: 'Unique Weapon',
      overview_type: 'UniqueWeapons', primary_value: 0.5, listing_count: 40,
      spark_total_change: 25, sparkline: []
    }],
    items: [{
      item_id: 'rare item', name: 'Rare Snipe', category: 'Rare Ring',
      overview_type: 'UniqueAccessories', primary_value: 2, listing_count: 10,
      spark_total_change: 45, sparkline: []
    }]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlipsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(FlipsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load flips on init and display results', () => {
    // flush the auto-triggered request
    fixture.detectChanges();
    httpMock.expectOne('/api/flips?minChange=10&maxListings=60&minListings=30&minVolume=100&limit=30').flush(mockFlips);
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.currencies.length).toBe(1);
    expect(component.liquidItems.length).toBe(1);
    expect(component.snipes.length).toBe(1);
  });

  it('should filter visible items by search query', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/flips?minChange=10&maxListings=60&minListings=30&minVolume=100&limit=30').flush(mockFlips);

    component.query = 'Rare';
    expect(component.visibleCurrencies.length).toBe(0);
    expect(component.visibleSnipes.length).toBe(1);
  });

  it('should reload with updated params', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/flips?minChange=10&maxListings=60&minListings=30&minVolume=100&limit=30').flush(mockFlips);

    component.minChange = 20;
    component.load();
    httpMock.expectOne('/api/flips?minChange=20&maxListings=60&minListings=30&minVolume=100&limit=30').flush(mockFlips);
  });
});
