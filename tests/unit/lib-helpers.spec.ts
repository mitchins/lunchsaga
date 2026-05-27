import { describe, it, expect } from 'vitest';
import {
  getNextOrganizer,
  calculateReputationScore,
  generateId,
  getAchievementTitle,
  getRandomTeamEmoji,
  getRandomTeamColor,
  TEAM_EMOJIS,
  TEAM_COLORS
} from '../../src/lib/helpers';
import type { TeamMember } from '../../src/lib/types';

describe('getNextOrganizer', () => {
  it('returns null for empty array', () => {
    expect(getNextOrganizer([])).toBeNull();
  });

  it('returns the only member when array has one member', () => {
    const member: TeamMember = {
      id: '1',
      name: 'Alice',
      points: 5,
      teamId: 'team1',
      userId: 'user1',
      totalWins: 0,
      reputationScore: 0,
      avatar: '',
      isAway: false
    };
    expect(getNextOrganizer([member])).toEqual(member);
  });

  it('returns member with lowest points', () => {
    const members: TeamMember[] = [
      { id: '1', name: 'Alice', points: 5, teamId: 't1', userId: 'u1', totalWins: 0, reputationScore: 0, avatar: '', isAway: false },
      { id: '2', name: 'Bob', points: 3, teamId: 't1', userId: 'u2', totalWins: 0, reputationScore: 0, avatar: '', isAway: false },
      { id: '3', name: 'Charlie', points: 7, teamId: 't1', userId: 'u3', totalWins: 0, reputationScore: 0, avatar: '', isAway: false }
    ];
    expect(getNextOrganizer(members)?.name).toBe('Bob');
  });

  it('returns alphabetically first member when multiple have same lowest points', () => {
    const members: TeamMember[] = [
      { id: '1', name: 'Charlie', points: 3, teamId: 't1', userId: 'u1', totalWins: 0, reputationScore: 0, avatar: '', isAway: false },
      { id: '2', name: 'Alice', points: 3, teamId: 't1', userId: 'u2', totalWins: 0, reputationScore: 0, avatar: '', isAway: false },
      { id: '3', name: 'Bob', points: 3, teamId: 't1', userId: 'u3', totalWins: 0, reputationScore: 0, avatar: '', isAway: false }
    ];
    expect(getNextOrganizer(members)?.name).toBe('Alice');
  });

  it('skips away members when selecting the next organizer', () => {
    const members: TeamMember[] = [
      { id: '1', name: 'Alice', points: 4, teamId: 't1', userId: 'u1', totalWins: 0, reputationScore: 0, avatar: '', isAway: false },
      { id: '2', name: 'Bob', points: 1, teamId: 't1', userId: 'u2', totalWins: 0, reputationScore: 0, avatar: '', isAway: true },
      { id: '3', name: 'Charlie', points: 6, teamId: 't1', userId: 'u3', totalWins: 0, reputationScore: 0, avatar: '', isAway: false }
    ];

    expect(getNextOrganizer(members)?.name).toBe('Alice');
  });
});

describe('calculateReputationScore', () => {
  it('returns 0 when no venues proposed', () => {
    expect(calculateReputationScore(10, 0)).toBe(0);
  });

  it('calculates reputation score correctly', () => {
    expect(calculateReputationScore(50, 10)).toBe(5);
    expect(calculateReputationScore(75, 10)).toBe(7.5);
    expect(calculateReputationScore(100, 12)).toBe(8.3);
  });

  it('rounds to one decimal place', () => {
    expect(calculateReputationScore(33, 10)).toBe(3.3);
    expect(calculateReputationScore(67, 10)).toBe(6.7);
  });
});

describe('generateId', () => {
  it('generates a unique string ID', () => {
    const id1 = generateId();
    const id2 = generateId();
    
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('includes timestamp and random component', () => {
    const id = generateId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });
});

describe('getAchievementTitle', () => {
  const createMember = (totalWins: number, reputationScore: number): TeamMember => ({
    id: '1',
    name: 'Test',
    points: 0,
    teamId: 't1',
    userId: 'u1',
    totalWins,
    reputationScore,
    avatar: '',
    isAway: false
  });

  it('returns Legendary Curator for 10+ wins', () => {
    expect(getAchievementTitle(createMember(10, 0))).toBe('🏆 Legendary Curator');
    expect(getAchievementTitle(createMember(15, 0))).toBe('🏆 Legendary Curator');
  });

  it('returns Master Chef for 5-9 wins', () => {
    expect(getAchievementTitle(createMember(5, 0))).toBe('⭐ Master Chef');
    expect(getAchievementTitle(createMember(9, 0))).toBe('⭐ Master Chef');
  });

  it('returns Food Guru for 3-4 wins', () => {
    expect(getAchievementTitle(createMember(3, 0))).toBe('🌟 Food Guru');
    expect(getAchievementTitle(createMember(4, 0))).toBe('🌟 Food Guru');
  });

  it('returns Taste Maker for 1-2 wins', () => {
    expect(getAchievementTitle(createMember(1, 0))).toBe('✨ Taste Maker');
    expect(getAchievementTitle(createMember(2, 0))).toBe('✨ Taste Maker');
  });

  it('returns Crowd Favorite for high reputation (8+)', () => {
    expect(getAchievementTitle(createMember(0, 8))).toBe('👑 Crowd Favorite');
    expect(getAchievementTitle(createMember(0, 10))).toBe('👑 Crowd Favorite');
  });

  it('returns Rising Star for medium reputation (5-7)', () => {
    expect(getAchievementTitle(createMember(0, 5))).toBe('🎯 Rising Star');
    expect(getAchievementTitle(createMember(0, 7))).toBe('🎯 Rising Star');
  });

  it('returns empty string for no achievements', () => {
    expect(getAchievementTitle(createMember(0, 0))).toBe('');
    expect(getAchievementTitle(createMember(0, 4))).toBe('');
  });
});

describe('getRandomTeamEmoji', () => {
  it('returns an emoji from TEAM_EMOJIS', () => {
    const emoji = getRandomTeamEmoji();
    expect(TEAM_EMOJIS).toContain(emoji);
  });

  it('returns a non-empty string', () => {
    expect(getRandomTeamEmoji()).toBeTruthy();
  });
});

describe('getRandomTeamColor', () => {
  it('returns a color value from TEAM_COLORS', () => {
    const color = getRandomTeamColor();
    const colorValues = TEAM_COLORS.map(c => c.value);
    expect(colorValues).toContain(color);
  });

  it('returns a hex color string', () => {
    const color = getRandomTeamColor();
    expect(color).toMatch(/^#[A-Fa-f0-9]{6}$/);
  });
});
