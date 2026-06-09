import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { LeaderboardScreen } from '@/screens/LeaderboardScreen'
import { TeamMember } from '@/lib/types'

const members: TeamMember[] = [
  {
    id: 'member-1',
    teamId: 'team-1',
    userId: 'user-1',
    name: 'Chef Ada',
    points: 8,
    reputationScore: 9.2,
    totalVenuesProposed: 10,
    totalWins: 2,
    isAway: false,
    joinedAt: 1,
  },
  {
    id: 'member-2',
    teamId: 'team-1',
    userId: 'user-2',
    name: 'Chef Bob',
    points: 14,
    reputationScore: 5.1,
    totalVenuesProposed: 4,
    totalWins: 1,
    isAway: false,
    joinedAt: 2,
  },
  {
    id: 'member-3',
    teamId: 'team-1',
    userId: 'user-3',
    name: 'Chef Cora',
    points: 3,
    reputationScore: 2.8,
    totalVenuesProposed: 0,
    totalWins: 0,
    isAway: false,
    joinedAt: 3,
  },
]

describe('LeaderboardScreen', () => {
  it('renders members sorted by reputation with leaderboard badges', () => {
    const onSelectMember = vi.fn()
    render(<LeaderboardScreen members={members} onBack={vi.fn()} onSelectMember={onSelectMember} />)

    const cards = screen.getAllByRole('button', { name: /View profile for/ })
    expect(cards).toHaveLength(3)
    expect(cards[0]).toHaveAccessibleName('View profile for Chef Ada')
    expect(cards[1]).toHaveAccessibleName('View profile for Chef Bob')
    expect(cards[2]).toHaveAccessibleName('View profile for Chef Cora')

    expect(screen.getByText('Top 1')).toBeInTheDocument()
    expect(screen.getByText('Top 2')).toBeInTheDocument()
    expect(screen.getByText('Top 3')).toBeInTheDocument()

    fireEvent.click(cards[0])
    expect(onSelectMember).toHaveBeenCalledWith('member-1')
  })

  it('supports keyboard selection in the sorted leaderboard', () => {
    const onSelectMember = vi.fn()
    render(<LeaderboardScreen members={members} onBack={vi.fn()} onSelectMember={onSelectMember} />)

    const firstCard = screen.getByRole('button', { name: 'View profile for Chef Ada' })
    firstCard.focus()
    fireEvent.keyDown(firstCard, { key: 'Enter' })
    fireEvent.keyDown(firstCard, { key: ' ' })

    expect(onSelectMember).toHaveBeenCalledTimes(2)
    expect(onSelectMember).toHaveBeenNthCalledWith(1, 'member-1')
    expect(onSelectMember).toHaveBeenNthCalledWith(2, 'member-1')
  })

  it('shows an empty state when no members are present', () => {
    render(<LeaderboardScreen members={[]} onBack={vi.fn()} />)

    expect(screen.getByText('No members yet')).toBeInTheDocument()
    expect(screen.getByText('Add team members to see the leaderboard')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /View profile for/ })).not.toBeInTheDocument()
  })

  it('renders non-selectable rows without profile actions and plain ranking for additional ranks', () => {
    const nonSelectableMembers: TeamMember[] = [
      ...members,
      {
        id: 'member-4',
        teamId: 'team-1',
        userId: 'user-4',
        name: 'Chef Delta',
        points: 2,
        reputationScore: 1.4,
        totalVenuesProposed: 1,
        totalWins: 0,
        isAway: false,
        joinedAt: 4,
      },
    ]

    render(<LeaderboardScreen members={nonSelectableMembers} onBack={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /View profile for/ })).not.toBeInTheDocument()
    expect(screen.getByText('Top 1')).toBeInTheDocument()
    expect(screen.getByText('Top 2')).toBeInTheDocument()
    expect(screen.getByText('Top 3')).toBeInTheDocument()
    expect(screen.queryByText('Top 4')).not.toBeInTheDocument()

    const deltaName = screen.getByText('Chef Delta')
    const deltaCard = deltaName.closest('div')?.parentElement?.parentElement
    expect(deltaCard).toBeTruthy()
    expect(within(deltaCard as Element).getByText('4')).toBeInTheDocument()
  })
})
