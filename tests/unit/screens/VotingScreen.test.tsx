import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VotingScreen } from '@/screens/VotingScreen'
import { LunchPeriod, TeamMember } from '@/lib/types'

const members: TeamMember[] = [
  {
    id: 'member-1',
    teamId: 'team-1',
    userId: 'user-1',
    name: 'Current Member',
    points: 10,
    reputationScore: 5,
    totalVenuesProposed: 1,
    totalWins: 0,
    isAway: false,
    joinedAt: 1,
  },
  {
    id: 'member-2',
    teamId: 'team-1',
    userId: 'user-2',
    name: 'Other Member',
    points: 15,
    reputationScore: 7,
    totalVenuesProposed: 2,
    totalWins: 0,
    isAway: false,
    joinedAt: 2,
  },
]

const period: LunchPeriod = {
  id: 'period-1',
  teamId: 'team-1',
  organizerId: 'member-1',
  startDate: 1,
  endDate: null,
  venueOptions: [
    {
      id: 'venue-1',
      name: 'Harbor Grill',
      description: 'Fresh fish and chips',
      proposedBy: 'member-1',
      votes: ['member-1', 'member-2'],
    },
  ],
  winningVenueId: null,
  status: 'voting',
  votingDeadline: null,
}

describe('VotingScreen', () => {
  it('renders empty state when no active period exists', () => {
    render(
      <VotingScreen
        period={null}
        members={members}
        currentMemberId="user-1"
        isHolidayMode={false}
        onBack={vi.fn()}
        onVote={vi.fn()}
        onComplete={vi.fn()}
        onStartWeek={vi.fn()}
      />,
    )

    expect(screen.getByText('The Chapter Awaits')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Begin This Chapter' })).toBeInTheDocument()
  })

  it('calls onComplete when user clicks Complete Voting', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined)

    render(
      <VotingScreen
        period={period}
        members={members}
        currentMemberId="user-1"
        isHolidayMode={false}
        onBack={vi.fn()}
        onVote={vi.fn()}
        onComplete={onComplete}
        onStartWeek={vi.fn()}
      />,
    )

    const completeButton = screen.getByRole('button', { name: /complete voting/i })
    fireEvent.click(completeButton)

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })
})
