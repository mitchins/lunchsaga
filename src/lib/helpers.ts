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
  { name: 'Ocean', value: 'oklch(0.65 0.15 220)' },
  { name: 'Sunset', value: 'oklch(0.70 0.18 30)' },
  { name: 'Forest', value: 'oklch(0.60 0.15 145)' },
  { name: 'Lavender', value: 'oklch(0.68 0.14 290)' },
  { name: 'Cherry', value: 'oklch(0.62 0.20 15)' },
  { name: 'Mint', value: 'oklch(0.72 0.12 165)' },
  { name: 'Amber', value: 'oklch(0.75 0.16 75)' },
  { name: 'Plum', value: 'oklch(0.58 0.18 310)' },
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
