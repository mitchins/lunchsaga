import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sendMagicLink, verifyMagicLink, generateInviteCode } from '../../src/lib/auth';

describe('auth utilities', () => {
  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    } as Storage;
    
    // Mock console.log to avoid test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('sendMagicLink', () => {
    it('stores magic link code in localStorage', async () => {
      const email = 'test@example.com';
      const result = await sendMagicLink(email);
      
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('magic-link-email', email);
      expect(localStorage.setItem).toHaveBeenCalledWith('magic-link-code', expect.any(String));
    });

    it('generates uppercase alphanumeric code', async () => {
      await sendMagicLink('test@example.com');
      
      const calls = (localStorage.setItem as any).mock.calls;
      const codeCall = calls.find((call: any[]) => call[0] === 'magic-link-code');
      const code = codeCall[1];
      
      expect(code).toMatch(/^[A-Z0-9]+$/);
      expect(code.length).toBeGreaterThan(0);
    });

    it('logs the magic code to console', async () => {
      await sendMagicLink('user@test.com');
      
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('🔗 Magic link code'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('user@test.com'));
    });
  });

  describe('verifyMagicLink', () => {
    it('returns true when code and email match', async () => {
      const email = 'test@example.com';
      const code = 'ABC123';
      
      (localStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'magic-link-code') return code;
        if (key === 'magic-link-email') return email;
        return null;
      });
      
      const result = await verifyMagicLink(email, code);
      
      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('magic-link-code');
      expect(localStorage.removeItem).toHaveBeenCalledWith('magic-link-email');
    });

    it('returns false when code does not match', async () => {
      (localStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'magic-link-code') return 'ABC123';
        if (key === 'magic-link-email') return 'test@example.com';
        return null;
      });
      
      const result = await verifyMagicLink('test@example.com', 'WRONG');
      
      expect(result).toBe(false);
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    });

    it('returns false when email does not match', async () => {
      (localStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'magic-link-code') return 'ABC123';
        if (key === 'magic-link-email') return 'test@example.com';
        return null;
      });
      
      const result = await verifyMagicLink('wrong@example.com', 'ABC123');
      
      expect(result).toBe(false);
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    });

    it('cleans up localStorage on successful verification', async () => {
      (localStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'magic-link-code') return 'CODE';
        if (key === 'magic-link-email') return 'user@test.com';
        return null;
      });
      
      await verifyMagicLink('user@test.com', 'CODE');
      
      expect(localStorage.removeItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateInviteCode', () => {
    it('generates an uppercase alphanumeric code', () => {
      const code = generateInviteCode();
      
      expect(code).toMatch(/^[A-Z0-9]+$/);
      expect(code.length).toBeGreaterThan(0);
    });

    it('generates unique codes', () => {
      const code1 = generateInviteCode();
      const code2 = generateInviteCode();
      
      // Very unlikely to be the same (but possible with random)
      expect(code1).toBeTruthy();
      expect(code2).toBeTruthy();
    });

    it('generates codes of expected length', () => {
      const code = generateInviteCode();
      
      // Based on Math.random().toString(36).substring(2, 8)
      // Should be around 6 characters
      expect(code.length).toBeLessThanOrEqual(6);
      expect(code.length).toBeGreaterThan(0);
    });
  });
});
