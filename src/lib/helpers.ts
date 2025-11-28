import { TeamMember } from './types'

export function getNextOrganizer(members: TeamMember[]): TeamMember | null {
  if (members.length === 0) return null
  
  const minPoints = Math.min(...members.map(m => m.points))
  const candidates = members.filter(m => m.points === minPoints)
  
  if (candidates.length === 1) return candidates[0]
  
  return candidates.sort((a, b) => a.name.localeCompare(b.name))[0]
}

export function calculateReputationScore(
  totalVotes: number,
  venuesProposed: number
): number {
  if (venuesProposed === 0) return 0
  return Math.round((totalVotes / venuesProposed) * 10) / 10
}

export function generateId(): string {
  const array = new Uint8Array(12) // Generate enough bytes
  crypto.getRandomValues(array)
  const randomPart = Array.from(array, byte => byte.toString(36))
    .join('')
    .replaceAll(/[^a-z0-9]/g, '')
    .substring(0, 9)
  return `${Date.now()}-${randomPart}`
}

export const TEAM_EMOJIS = [
  '🍕', '🍔', '🌮', '🍜', '🍱', '🥗', '🍛', '🥘', 
  '🍝', '🥙', '🌭', '🍖', '🦞', '🍤', '🥟', '🍲',
  '🎉', '🚀', '⚡', '🔥', '✨', '🌟', '💫', '🎯'
]

export const TEAM_COLORS = [
  { name: 'Ocean', value: '#3B82F6' },
  { name: 'Sunset', value: '#F97316' },
  { name: 'Forest', value: '#22C55E' },
  { name: 'Lavender', value: '#A855F7' },
  { name: 'Cherry', value: '#EF4444' },
  { name: 'Mint', value: '#14B8A6' },
  { name: 'Amber', value: '#EAB308' },
  { name: 'Plum', value: '#EC4899' },
]

export function getRandomTeamEmoji(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const index = array[0] % TEAM_EMOJIS.length
  return TEAM_EMOJIS[index]
}

export function getRandomTeamColor(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const index = array[0] % TEAM_COLORS.length
  return TEAM_COLORS[index].value
}

export function getAchievementTitle(member: TeamMember): string {
  if (member.totalWins >= 10) return '🏆 Legendary Curator'
  if (member.totalWins >= 5) return '⭐ Master Chef'
  if (member.totalWins >= 3) return '🌟 Food Guru'
  if (member.totalWins >= 1) return '✨ Taste Maker'
  if (member.reputationScore >= 8) return '👑 Crowd Favorite'
  if (member.reputationScore >= 5) return '🎯 Rising Star'
  return ''
}
