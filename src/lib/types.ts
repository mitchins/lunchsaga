export interface TeamMember {
  id: string
  name: string
  points: number
  reputationScore: number
  totalVenuesProposed: number
  joinedAt: number
}

export interface VenueOption {
  id: string
  name: string
  description: string
  votes: string[]
}

export interface LunchPeriod {
  id: string
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
