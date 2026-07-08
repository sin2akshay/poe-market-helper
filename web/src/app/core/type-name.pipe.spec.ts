import { TypeNamePipe } from './type-name.pipe';

describe('TypeNamePipe', () => {
  const pipe = new TypeNamePipe();

  it('inserts space before uppercase letter preceded by lowercase', () => {
    expect(pipe.transform('UniqueWeapons')).toBe('Unique Weapons');
  });

  it('inserts space before uppercase letter preceded by digit', () => {
    expect(pipe.transform('Item1Type')).toBe('Item1 Type');
  });

  it('handles multiple camelCase transitions', () => {
    expect(pipe.transform('LineageSupportGems')).toBe('Lineage Support Gems');
  });

  it('only splits lowercase-digit followed by uppercase (JSONParser stays intact)', () => {
    expect(pipe.transform('JSONParser')).toBe('JSONParser');
  });

  it('returns empty string for null/undefined input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('returns unchanged for single word', () => {
    expect(pipe.transform('Currency')).toBe('Currency');
  });

  it('returns unchanged for all lowercase', () => {
    expect(pipe.transform('currency')).toBe('currency');
  });
});
