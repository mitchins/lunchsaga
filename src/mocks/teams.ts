import { Team } from '@/lib/types'

export const mockTeam: Team = {
  id: 'team-1',
  name: 'Engineering Team',
  emoji: '🚀',
  color: 'oklch(0.65 0.15 220)',
  ownerId: 'user-1',
  createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
  inviteCode: 'ENG123',
}

export const mockTeams: Team[] = [
  mockTeam,
  {
    id: 'team-2',
    name: 'Marketing Squad',
    emoji: '📢',
    color: 'oklch(0.70 0.18 30)',
    ownerId: 'user-2',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    inviteCode: 'MKT456',
  },
  {
    id: 'team-3',
    name: 'Design Crew',
    emoji: '🎨',
    color: 'oklch(0.68 0.14 290)',
    ownerId: 'user-1',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    inviteCode: 'DSN789',
  },
]
