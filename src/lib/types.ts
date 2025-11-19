export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: number
}

export interface Team {
  id: string
  name: string
  emoji: string
  color: string
  ownerId: string
  createdAt: number
  inviteCode: string
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  name: string
  points: number
  reputationScore: number
  totalVenuesProposed: number
  totalWins: number
  joinedAt: number
}

export interface VenueOption {
  id: string
  name: string
  description: string
  votes: string[]
  proposedBy: string
}

export interface LunchPeriod {
  id: string
  teamId: string
  organizerId: string
  startDate: number
  endDate: number | null
  venueOptions: VenueOption[]
  winningVenueId: string | null
  status: 'proposing' | 'voting' | 'completed'
  votingDeadline: number | null
}

export interface AppState {
  members: TeamMember[]
  currentPeriod: LunchPeriod | null
  history: LunchPeriod[]
  isHolidayMode: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}
