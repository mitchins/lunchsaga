export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  criteria: string
  unlockProgress?: number
  unlockTarget?: number
}

export const mockBadges: Badge[] = [
  {
    id: 'badge-1',
    name: 'First Quest',
    description: 'Organized your first lunch pick',
    icon: '⚔️',
    rarity: 'common',
    criteria: 'Organize 1 lunch',
  },
  {
    id: 'badge-2',
    name: 'Devoted Squire',
    description: 'Never missed a vote for 4 weeks',
    icon: '🛡️',
    rarity: 'uncommon',
    criteria: 'Vote in 4 consecutive weeks',
  },
  {
    id: 'badge-3',
    name: 'Rising Star',
    description: 'Your venue won unanimously',
    icon: '🌟',
    rarity: 'rare',
    criteria: 'Win with 100% of votes',
  },
  {
    id: 'badge-4',
    name: 'Legendary Curator',
    description: 'Won 10 lunch picks',
    icon: '👑',
    rarity: 'legendary',
    criteria: 'Win 10 lunch picks',
    unlockProgress: 3,
    unlockTarget: 10,
  },
  {
    id: 'badge-5',
    name: 'Noble Palate',
    description: 'High reputation score over time',
    icon: '🏆',
    rarity: 'rare',
    criteria: 'Maintain 8.0+ reputation',
  },
  {
    id: 'badge-6',
    name: 'Taste Maker',
    description: 'Won your first lunch pick',
    icon: '⭐',
    rarity: 'common',
    criteria: 'Win 1 lunch pick',
  },
  {
    id: 'badge-7',
    name: 'Realm Explorer',
    description: 'Proposed 5 different venues',
    icon: '🗺️',
    rarity: 'uncommon',
    criteria: 'Propose 5 venues',
    unlockProgress: 3,
    unlockTarget: 5,
  },
  {
    id: 'badge-8',
    name: 'Fire Dragon',
    description: 'Won 5 lunch picks in a row',
    icon: '🐉',
    rarity: 'rare',
    criteria: 'Win 5 consecutive picks',
  },
  {
    id: 'badge-9',
    name: 'Protector of the Usual',
    description: 'Voted for the same venue 3 times',
    icon: '⚔️',
    rarity: 'common',
    criteria: 'Show loyalty to a favorite spot',
  },
]

export interface UserBadge {
  badgeId: string
  userId: string
  earnedAt: number
}

export const mockUserBadges: UserBadge[] = [
  {
    badgeId: 'badge-1',
    userId: 'user-1',
    earnedAt: Date.now() - 80 * 24 * 60 * 60 * 1000,
  },
  {
    badgeId: 'badge-6',
    userId: 'user-1',
    earnedAt: Date.now() - 70 * 24 * 60 * 60 * 1000,
  },
  {
    badgeId: 'badge-3',
    userId: 'user-1',
    earnedAt: Date.now() - 50 * 24 * 60 * 60 * 1000,
  },
  {
    badgeId: 'badge-5',
    userId: 'user-1',
    earnedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
]
