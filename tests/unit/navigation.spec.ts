import { describe, it, expect } from 'vitest';
import { normalizePath, isRouteAllowed } from '../../src/utils/navigation';

describe('navigation utilities', () => {
  it('normalizes paths with missing leading slash', () => {
    expect(normalizePath('dashboard')).toBe('/dashboard');
    expect(normalizePath('/dashboard')).toBe('/dashboard');
  });

  it('determines whether a URL matches allowed paths', () => {
    const allowed = ['/dashboard', 'teams'];
    expect(isRouteAllowed('https://example.com/dashboard', allowed)).toBe(true);
    expect(isRouteAllowed('https://example.com/teams/abc', allowed)).toBe(true);
    expect(isRouteAllowed('https://example.com/profile/1', allowed)).toBe(false);
  });
});
