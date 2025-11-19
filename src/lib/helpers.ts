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
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
