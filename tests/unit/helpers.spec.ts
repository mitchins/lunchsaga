import { describe, it, expect, vi } from 'vitest';
import { navigateAndWait, isValidPath } from '../e2e/helpers';

describe('E2E helper utilities', () => {
  it('navigateAndWait calls navigation and load state APIs', async () => {
    const goto = vi.fn().mockResolvedValue(undefined);
    const waitForLoadState = vi.fn().mockResolvedValue(undefined);
    const page = { goto, waitForLoadState } as unknown as Parameters<typeof navigateAndWait>[0];

    await navigateAndWait(page, '/test-path');

    expect(goto).toHaveBeenCalledWith('/test-path');
    expect(waitForLoadState).toHaveBeenCalledWith('networkidle');
  });

  it('isValidPath matches valid routes', () => {
    expect(isValidPath('https://example.com/dashboard', ['/dashboard'])).toBe(true);
    expect(isValidPath('https://example.com/login', ['/dashboard'])).toBe(false);
    expect(isValidPath('', ['/dashboard'])).toBe(false);
  });
});
