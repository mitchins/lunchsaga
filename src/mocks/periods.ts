import { LunchPeriod, VenueOption } from '@/lib/types'

export const mockVenueOptions: VenueOption[] = [
  {
    id: 'venue-1',
    name: 'Taco Palace',
    description: 'Authentic Mexican street tacos',
    votes: ['member-1', 'member-3', 'member-5'],
    proposedBy: 'member-4',
  },
  {
    id: 'venue-2',
    name: 'Sushi Express',
    description: 'Fresh sushi and sashimi',
    votes: ['member-2'],
    proposedBy: 'member-4',
  },
  {
    id: 'venue-3',
    name: 'Pizza Corner',
    description: 'Wood-fired pizza',
    votes: ['member-4'],
    proposedBy: 'member-4',
  },
]

export const mockCurrentPeriod: LunchPeriod = {
  id: 'period-current',
  teamId: 'team-1',
  organizerId: 'member-4',
  startDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
  endDate: null,
  venueOptions: mockVenueOptions,
  winningVenueId: null,
  status: 'voting',
  votingDeadline: Date.now() + 5 * 24 * 60 * 60 * 1000,
}

export const mockHistory: LunchPeriod[] = [
  {
    id: 'period-1',
    teamId: 'team-1',
    organizerId: 'member-1',
    startDate: Date.now() - 21 * 24 * 60 * 60 * 1000,
    endDate: Date.now() - 14 * 24 * 60 * 60 * 1000,
    venueOptions: [
      {
        id: 'venue-h1-1',
        name: 'Thai Basil',
        description: 'Spicy Thai cuisine',
        votes: ['member-1', 'member-2', 'member-3'],
        proposedBy: 'member-1',
      },
      {
        id: 'venue-h1-2',
        name: 'Burger Joint',
        description: 'Gourmet burgers',
        votes: ['member-4', 'member-5'],
        proposedBy: 'member-1',
      },
    ],
    winningVenueId: 'venue-h1-1',
    status: 'completed',
    votingDeadline: Date.now() - 14 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'period-2',
    teamId: 'team-1',
    organizerId: 'member-2',
    startDate: Date.now() - 14 * 24 * 60 * 60 * 1000,
    endDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    venueOptions: [
      {
        id: 'venue-h2-1',
        name: 'Mediterranean Grill',
        description: 'Fresh Mediterranean flavors',
        votes: ['member-1', 'member-3', 'member-4', 'member-5'],
        proposedBy: 'member-2',
      },
      {
        id: 'venue-h2-2',
        name: 'Ramen House',
        description: 'Authentic Japanese ramen',
        votes: ['member-2'],
        proposedBy: 'member-2',
      },
    ],
    winningVenueId: 'venue-h2-1',
    status: 'completed',
    votingDeadline: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'period-3',
    teamId: 'team-1',
    organizerId: 'member-3',
    startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    endDate: Date.now(),
    venueOptions: [
      {
        id: 'venue-h3-1',
        name: 'Italian Bistro',
        description: 'Classic Italian pasta',
        votes: ['member-1', 'member-2', 'member-3', 'member-4', 'member-5'],
        proposedBy: 'member-3',
      },
      {
        id: 'venue-h3-2',
        name: 'BBQ Shack',
        description: 'Slow-smoked BBQ',
        votes: [],
        proposedBy: 'member-3',
      },
    ],
    winningVenueId: 'venue-h3-1',
    status: 'completed',
    votingDeadline: Date.now(),
  },
]
