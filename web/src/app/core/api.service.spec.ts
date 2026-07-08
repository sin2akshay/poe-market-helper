import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Summary, Insights, Meta, CurrencyResponse } from './models';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getSummary', () => {
    it('GETs /api/summary', () => {
      const mock: Summary = {
        league: 'Settlers',
        fetchedAt: 1700000000000,
        chaosPerDivine: 230,
        divinePerChaos: 0.0043,
        exaltedPerDivine: 46,
        currencyRowCount: 14,
        itemRowCount: 500,
        snapshotCount: 3
      };
      service.getSummary().subscribe((s) => {
        expect(s.league).toBe('Settlers');
        expect(s.chaosPerDivine).toBe(230);
      });
      const req = httpMock.expectOne('/api/summary');
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });
  });

  describe('getMeta', () => {
    it('GETs /api/meta', () => {
      const mock: Meta = {
        league: 'Settlers',
        currencyExchangeTypes: ['Currency', 'Fragment'],
        stashItemTypes: ['UniqueWeapons', 'UniqueArmours']
      };
      service.getMeta().subscribe((m) => {
        expect(m.league).toBe('Settlers');
        expect(m.currencyExchangeTypes.length).toBe(2);
      });
      httpMock.expectOne('/api/meta').flush(mock);
    });
  });

  describe('getInsights', () => {
    it('GETs /api/insights', () => {
      const mock: Insights = {
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
      service.getInsights().subscribe((i) => {
        expect(i.rates.exaltedPerDivine).toBe(46);
      });
      httpMock.expectOne('/api/insights').flush(mock);
    });
  });

  describe('getCurrency', () => {
    it('GETs /api/currency without type param when omitted', () => {
      const mock: CurrencyResponse = { fetchedAt: 1700000000000, type: 'Currency', lines: [] };
      service.getCurrency().subscribe((r) => expect(r.type).toBe('Currency'));
      httpMock.expectOne('/api/currency').flush(mock);
    });

    it('GETs /api/currency?type=Foo when type is provided', () => {
      service.getCurrency('Fragment').subscribe();
      httpMock.expectOne('/api/currency?type=Fragment').flush({ fetchedAt: 0, type: 'Fragment', lines: [] });
    });
  });

  describe('getCurrencyHistory', () => {
    it('GETs /api/currency/history?id=chaos', () => {
      service.getCurrencyHistory('chaos').subscribe((r) => expect(r.itemId).toBe('chaos'));
      httpMock.expectOne('/api/currency/history?id=chaos').flush({ itemId: 'chaos', points: [] });
    });
  });

  describe('getItems', () => {
    it('passes sort and dir params', () => {
      service.getItems({ sort: 'value', dir: 'asc' }).subscribe();
      httpMock.expectOne('/api/items?sort=value&dir=asc').flush({ fetchedAt: 0, type: 'UniqueWeapons', lines: [] });
    });

    it('includes maxListings when provided', () => {
      service.getItems({ maxListings: 60 }).subscribe();
      httpMock.expectOne('/api/items?maxListings=60').flush({ fetchedAt: 0, type: 'UniqueWeapons', lines: [] });
    });
  });

  describe('getFlips', () => {
    it('passes all filter params', () => {
      service.getFlips({ minChange: 10, maxListings: 60, minListings: 30, minVolume: 100, limit: 20 }).subscribe();
      httpMock.expectOne(
        '/api/flips?minChange=10&maxListings=60&minListings=30&minVolume=100&limit=20'
      ).flush({ fetchedAt: 0, currencies: [], liquidItems: [], items: [] });
    });
  });
});
