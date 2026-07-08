import { TestBed } from '@angular/core/testing';
import { DenomService } from './denom.service';

describe('DenomService', () => {
  let service: DenomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DenomService);
  });

  it('defaults to exalted denomination', () => {
    expect(service.denom()).toBe('exalted');
  });

  it('computes rate of 1 when no rates are set', () => {
    expect(service.rate()).toBe(1);
  });

  it('computes correct chaos rate', () => {
    service.setRates({ chaosPerDivine: 250, exaltedPerDivine: 50 });
    service.set('chaos');
    expect(service.rate()).toBe(250);
  });

  it('computes correct exalted rate', () => {
    service.setRates({ chaosPerDivine: 250, exaltedPerDivine: 50 });
    service.set('exalted');
    expect(service.rate()).toBe(50);
  });

  it('rate stays 1 for divine denomination', () => {
    service.setRates({ chaosPerDivine: 250, exaltedPerDivine: 50 });
    service.set('divine');
    expect(service.rate()).toBe(1);
  });

  it('switches denomination via set()', () => {
    service.set('chaos');
    expect(service.denom()).toBe('chaos');
    service.set('divine');
    expect(service.denom()).toBe('divine');
  });

  it('returns correct suffix per denomination', () => {
    service.set('divine');
    expect(service.suffix()).toBe('div');
    service.set('chaos');
    expect(service.suffix()).toBe('c');
    service.set('exalted');
    expect(service.suffix()).toBe('ex');
  });

  describe('convert', () => {
    beforeEach(() => {
      service.setRates({ chaosPerDivine: 200, exaltedPerDivine: 40 });
    });

    it('converts divine to exalted', () => {
      service.set('exalted');
      expect(service.convert(1)).toBe(40);
      expect(service.convert(0.5)).toBe(20);
    });

    it('converts divine to chaos', () => {
      service.set('chaos');
      expect(service.convert(1)).toBe(200);
      expect(service.convert(0.1)).toBe(20);
    });

    it('returns divine value unchanged when denom is divine', () => {
      service.set('divine');
      expect(service.convert(5)).toBe(5);
    });

    it('returns null for null/undefined input', () => {
      expect(service.convert(null)).toBeNull();
      expect(service.convert(undefined)).toBeNull();
    });

    it('returns 0 for 0 input', () => {
      service.set('chaos');
      expect(service.convert(0)).toBe(0);
    });
  });

  describe('formatNumber', () => {
    it('formats >= 1000 with locale string', () => {
      expect(service.formatNumber(7704)).toBe('7,704');
      expect(service.formatNumber(-5000)).toBe('-5,000');
    });

    it('formats 100–999 with 0 decimal', () => {
      expect(service.formatNumber(456)).toBe('456');
      expect(service.formatNumber(-789)).toBe('-789');
    });

    it('formats 10–99 with 1 decimal', () => {
      expect(service.formatNumber(63.9)).toBe('63.9');
      expect(service.formatNumber(-42.1)).toBe('-42.1');
    });

    it('formats 1–9 with 2 decimals', () => {
      expect(service.formatNumber(3.14)).toBe('3.14');
    });

    it('formats 0.01–0.99 with 3 decimals', () => {
      expect(service.formatNumber(0.083)).toBe('0.083');
    });

    it('handles zero', () => {
      expect(service.formatNumber(0)).toBe('0');
    });

    it('uses toPrecision for very small values', () => {
      const result = service.formatNumber(0.0005);
      expect(result).toBe('0.00050');
    });
  });

  describe('format', () => {
    beforeEach(() => {
      service.setRates({ chaosPerDivine: 200, exaltedPerDivine: 50 });
    });

    it('returns em-dash for null/undefined', () => {
      expect(service.format(null)).toBe('—');
      expect(service.format(undefined)).toBe('—');
    });

    it('formats with correct suffix', () => {
      service.set('chaos');
      expect(service.format(1)).toBe('200 c');
      service.set('exalted');
      // 1 divine * 50 = 50 → formatNumber(50) → 50.0 (abs >= 10)
      expect(service.format(1)).toBe('50.0 ex');
      service.set('divine');
      expect(service.format(3.5)).toBe('3.50 div');
    });
  });
});
