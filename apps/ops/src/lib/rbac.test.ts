import { describe, it, expect } from 'vitest';
import { formatAddressForRole, formatPriceForRole } from './rbac';

describe('formatAddressForRole', () => {
  it('returns N/A if address is null', () => {
    expect(formatAddressForRole(null, 'admin')).toBe('N/A');
  });

  it('returns N/A if address is empty string', () => {
    expect(formatAddressForRole('', 'admin')).toBe('N/A');
  });

  it('returns the original address for admin role', () => {
    expect(formatAddressForRole('123 Main St, Springfield', 'admin')).toBe('123 Main St, Springfield');
  });

  it('returns redacted string for finance role', () => {
    expect(formatAddressForRole('123 Main St, Springfield', 'finance')).toBe('Redacted (Restricted Role)');
  });

  it('returns redacted string for warehouse role', () => {
    expect(formatAddressForRole('123 Main St, Springfield', 'warehouse')).toBe('Redacted (Restricted Role)');
  });
});

describe('formatPriceForRole', () => {
  it('returns formatted price for admin role', () => {
    expect(formatPriceForRole(100.5, 'admin')).toBe('R 100.50');
    expect(formatPriceForRole('50', 'admin')).toBe('R 50.00');
  });

  it('returns formatted price for finance role', () => {
    expect(formatPriceForRole(100.5, 'finance')).toBe('R 100.50');
  });

  it('returns hidden string for warehouse role', () => {
    expect(formatPriceForRole(100.5, 'warehouse')).toBe('R *** (Hidden)');
  });
});
