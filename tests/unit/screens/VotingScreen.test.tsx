import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VotingScreen, completeVoting } from '@/screens/VotingScreen'
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

  it('suppresses start button while in holiday mode and explains lockout', () => {
    render(
      <VotingScreen
        period={null}
        members={members}
        currentMemberId="user-1"
        isHolidayMode={true}
        onBack={vi.fn()}
        onVote={vi.fn()}
        onComplete={vi.fn()}
        onStartWeek={vi.fn()}
      />,
    )

    expect(screen.getByText('The Chapter Awaits')).toBeInTheDocument()
    expect(
      screen.getByText('Your saga is paused. Disable holiday mode to continue your culinary journey.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Begin This Chapter' })).not.toBeInTheDocument()
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

  it('prevents overlapping completions while async work is in flight', async () => {
    let resolveComplete = () => {}
    const onComplete = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveComplete = resolve
        }),
    )

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
    completeButton.disabled = false
    fireEvent.click(completeButton)

    expect(onComplete).toHaveBeenCalledTimes(1)

    resolveComplete()
    await waitFor(() => {
      expect(completeButton).not.toBeDisabled()
    })
  })

  it('does not invoke completion flow when already in-flight', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined)
    const setIsCompleting = vi.fn()

    await completeVoting({
      isCompleting: true,
      onComplete,
      setIsCompleting,
    })

    expect(onComplete).not.toHaveBeenCalled()
    expect(setIsCompleting).not.toHaveBeenCalled()
  })

  it('toggles completion state around a successful completion', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined)
    const setIsCompleting = vi.fn()

    await completeVoting({
      isCompleting: false,
      onComplete,
      setIsCompleting,
    })

    expect(setIsCompleting).toHaveBeenCalledWith(true)
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(setIsCompleting).toHaveBeenCalledWith(false)
  })

  it('does not show completion controls before current member has voted', () => {
    const noVotePeriod: LunchPeriod = {
      ...period,
      venueOptions: [
        {
          id: 'venue-1',
          name: 'Harbor Grill',
          description: 'Fresh fish and chips',
          proposedBy: 'member-2',
          votes: ['member-2'],
        },
      ],
    }

    render(
      <VotingScreen
        period={noVotePeriod}
        members={members}
        currentMemberId="user-1"
        isHolidayMode={false}
        onBack={vi.fn()}
        onVote={vi.fn()}
        onComplete={vi.fn()}
        onStartWeek={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /complete voting/i })).not.toBeInTheDocument()
    const progress = screen.getByRole('progressbar')
    expect(progress.parentElement).toHaveTextContent('1 of 2 votes cast')
  })

  it('hides the vote progress summary when nobody has voted yet', () => {
    const noVotesPeriod: LunchPeriod = {
      ...period,
      venueOptions: [
        {
          id: 'venue-1',
          name: 'Harbor Grill',
          description: 'Fresh fish and chips',
          proposedBy: 'member-1',
          votes: [],
        },
      ],
    }

    render(
      <VotingScreen
        period={noVotesPeriod}
        members={members}
        currentMemberId="user-1"
        isHolidayMode={false}
        onBack={vi.fn()}
        onVote={vi.fn()}
        onComplete={vi.fn()}
        onStartWeek={vi.fn()}
      />,
    )

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('shows singular progress wording when only one active member exists', () => {
    const singleMember = {
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
    }
    const singleMemberPeriod: LunchPeriod = {
      ...period,
      organizerId: singleMember.id,
      venueOptions: [
        {
          id: 'venue-1',
          name: 'Harbor Grill',
          description: 'Fresh fish and chips',
          proposedBy: singleMember.id,
          votes: [singleMember.id],
        },
      ],
    }

    render(
      <VotingScreen
        period={singleMemberPeriod}
        members={[singleMember]}
        currentMemberId="user-1"
        isHolidayMode={false}
        onBack={vi.fn()}
        onVote={vi.fn()}
        onComplete={vi.fn()}
        onStartWeek={vi.fn()}
      />,
    )

    const progressBars = screen.getAllByRole('progressbar')
    expect(progressBars).toHaveLength(2)
    expect(progressBars[0].parentElement).toHaveTextContent('1 of 1 vote cast')
  })

  it('handles an empty active-member set without progress or completion controls', () => {
    const allAwayMembers = members.map((member) => ({ ...member, isAway: true }))

    render(
      <VotingScreen
        period={period}
        members={allAwayMembers}
        currentMemberId={null}
        isHolidayMode={false}
        onBack={vi.fn()}
        onVote={vi.fn()}
        onComplete={vi.fn()}
        onStartWeek={vi.fn()}
      />,
    )

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /complete voting/i })).not.toBeInTheDocument()
  })
})
