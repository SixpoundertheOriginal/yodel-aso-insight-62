
import { formatPercentage } from './format';

// Adding a reference to Jest types
/// <reference types="jest" />

describe('formatPercentage', () => {
  it('formats a number with one decimal place by default', () => {
    expect(formatPercentage(5.4321)).toBe('5.4');
  });

  it('rounds to the nearest decimal place', () => {
    expect(formatPercentage(-0.07)).toBe('-0.1');
  });

  it('formats with zero decimal places when specified', () => {
    expect(formatPercentage(12, 0)).toBe('12');
  });

  it('handles zero values correctly', () => {
    expect(formatPercentage(0)).toBe('0.0');
  });

  it('handles larger numbers correctly', () => {
    expect(formatPercentage(1234.56)).toBe('1,234.6');
  });
});
