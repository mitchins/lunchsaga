import '@testing-library/jest-dom/vitest'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfileScreen } from '@/screens/ProfileScreen'
import { TeamDashboardScreen } from '@/screens/TeamDashboardScreen'
import { VotingScreen } from '@/screens/VotingScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import type { LunchPeriod, Team, TeamMember } from '@/lib/types'
import type { Badge, UserBadge } from '@/mocks/badges'

const sonnerMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: sonnerMocks,
}))

vi.mock('@/components/BadgeIcon', () => ({
  BadgeIcon: ({ badge, earned }: { badge: Badge; earned: boolean }) => (
    <div data-testid={`badge-${badge.id}`}>{earned ? 'earned' : 'locked'}</div>
  ),
}))

vi.mock('@/components/TitleTag', () => ({
  TitleTag: ({ title }: { title: string }) => <div>{title}</div>,
}))

vi.mock('@/components/AddMemberDialog', () => ({
  AddMemberDialog: () => <div>Add member</div>,
}))

vi.mock('@/components/Leaderboard', () => ({
  Leaderboard: ({ members }: { members: TeamMember[] }) => <div>Leaderboard {members.length}</div>,
}))

vi.mock('@/components/MemberCard', () => ({
  MemberCard: ({ member }: { member: TeamMember }) => <div data-testid="member-card">{member.name}</div>,
}))

vi.mock('@/components/TeamSwitcher', () => ({
  TeamSwitcher: ({ teams, currentTeamId, onTeamChange }: { teams: Team[]; currentTeamId: string; onTeamChange: (teamId: string) => void }) => (
    <button
      type="button"
      onClick={() => onTeamChange(teams.find((team) => team.id !== currentTeamId)?.id ?? currentTeamId)}
    >
      Switch team
    </button>
  ),
}))

vi.mock('@/components/EmptyState', () => ({
  EmptyState: ({ title, description, action }: { title: string; description: string; action?: { label: string; onClick: () => void } }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      {action ? <button onClick={action.onClick}>{action.label}</button> : null}
    </div>
  ),
}))

const baseMember: TeamMember = {
  id: 'member-1',
  teamId: 'team-1',
  userId: 'user-1',
  name: 'Alice Example',
  points: 10,
  reputationScore: 9.2,
  totalVenuesProposed: 4,
  totalWins: 2,
  isAway: false,
  joinedAt: 1,
}

const badges: Badge[] = [
  {
    id: 'badge-1',
    name: 'First Quest',
    description: 'Did a thing',
    icon: 'star',
    rarity: 'common',
    criteria: 'Be great',
  },
  {
    id: 'badge-2',
    name: 'Legend',
    description: 'Did another thing',
    icon: 'trophy',
    rarity: 'rare',
    criteria: 'Be greater',
  },
]

const userBadges: UserBadge[] = [{ badgeId: 'badge-1', userId: 'user-1', earnedAt: 1 }]

const baseTeam: Team = {
  id: 'team-1',
  name: 'Lunch Crew',
  emoji: '🍜',
  color: '#000000',
  ownerId: 'user-1',
  createdAt: 1,
  inviteCode: 'ABC123',
}

function createPeriod(overrides: Partial<LunchPeriod> = {}): LunchPeriod {
  return {
    id: 'period-1',
    teamId: 'team-1',
    organizerId: 'member-1',
    startDate: 1,
    endDate: null,
    winningVenueId: null,
    status: 'voting',
    votingDeadline: null,
    venueOptions: [
      {
        id: 'venue-1',
        name: 'Sushi Place',
        description: 'Fresh rolls',
        votes: [],
        proposedBy: 'member-1',
      },
      {
        id: 'venue-2',
        name: 'Burger Town',
        description: 'Big burgers',
        votes: [],
        proposedBy: 'member-2',
      },
    ],
    ...overrides,
  }
}

describe('screen flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lets a user edit and save their profile name', async () => {
    const user = userEvent.setup()
    const onUpdateName = vi.fn().mockResolvedValue(undefined)

    render(
      <ProfileScreen
        member={baseMember}
        badges={badges}
        userBadges={userBadges}
        isOwnProfile={true}
        onBack={vi.fn()}
        onUpdateName={onUpdateName}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit name' }))

    const input = screen.getByPlaceholderText('Enter your name')
    await user.clear(input)
    await user.type(input, 'Alicia Example')
    await user.click(screen.getByRole('button', { name: 'Save name' }))

    await waitFor(() => expect(onUpdateName).toHaveBeenCalledWith('Alicia Example'))
    expect(sonnerMocks.success).toHaveBeenCalledWith('Name updated successfully')
  })

  it('forwards away-status changes from the profile screen', async () => {
    const user = userEvent.setup()
    const onToggleAway = vi.fn().mockResolvedValue(undefined)

    render(
      <ProfileScreen
        member={baseMember}
        badges={badges}
        userBadges={userBadges}
        isOwnProfile={true}
        onBack={vi.fn()}
        onToggleAway={onToggleAway}
      />,
    )

    await user.click(screen.getByRole('switch', { name: 'Away Status' }))

    await waitFor(() => expect(onToggleAway).toHaveBeenCalledWith(true))
    expect(sonnerMocks.success).toHaveBeenCalledWith('Marked as away')
  })

  it('sorts members and routes dashboard actions to the provided callbacks', async () => {
    const user = userEvent.setup()
    const onNavigateToProfile = vi.fn()
    const onNavigateToVote = vi.fn()
    const onNavigateToHistory = vi.fn()

    render(
      <TeamDashboardScreen
        team={baseTeam}
        teams={[baseTeam, { ...baseTeam, id: 'team-2', name: 'Backup Crew' }]}
        members={[
          { ...baseMember, id: 'member-2', userId: 'user-2', name: 'Bob Example', points: 20 },
          { ...baseMember, id: 'member-1', userId: 'user-1', name: 'Alice Example', points: 5 },
        ]}
        currentUserMemberId="member-1"
        nextOrganizer={baseMember}
        isHolidayMode={false}
        onBack={vi.fn()}
        onTeamSwitch={vi.fn()}
        onAddMember={vi.fn()}
        onRemoveMember={vi.fn()}
        onToggleHoliday={vi.fn()}
        onToggleMemberAway={vi.fn()}
        onNavigateToVote={onNavigateToVote}
        onNavigateToHistory={onNavigateToHistory}
        onNavigateToProfile={onNavigateToProfile}
      />,
    )

    expect(screen.getAllByTestId('member-card').map((node) => node.textContent)).toEqual([
      'Alice Example',
      'Bob Example',
    ])

    await user.click(screen.getByRole('button', { name: 'My Profile' }))
    expect(onNavigateToProfile).toHaveBeenCalledWith('member-1')

    await user.click(screen.getByRole('tab', { name: /vote/i }))
    await user.click(screen.getByRole('button', { name: 'Go to Voting' }))
    expect(onNavigateToVote).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('tab', { name: /history/i }))
    await user.click(screen.getByRole('button', { name: 'View History' }))
    expect(onNavigateToHistory).toHaveBeenCalledTimes(1)
  })

  it('starts a new chapter from the empty voting state when holiday mode is off', async () => {
    const user = userEvent.setup()
    const onStartWeek = vi.fn()

    render(
      <VotingScreen
        period={null}
        members={[baseMember]}
        currentMemberId={baseMember.userId}
        isHolidayMode={false}
        onBack={vi.fn()}
        onVote={vi.fn()}
        onComplete={vi.fn()}
        onStartWeek={onStartWeek}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Begin This Chapter' }))

    expect(onStartWeek).toHaveBeenCalledTimes(1)
  })

  it('submits a vote for the selected venue', async () => {
    const user = userEvent.setup()
    const onVote = vi.fn()
    const organizer = { ...baseMember, id: 'member-1', userId: 'user-1', name: 'Organizer' }
    const voter = { ...baseMember, id: 'member-2', userId: 'user-2', name: 'Voter' }

    render(
      <VotingScreen
        period={createPeriod({ organizerId: organizer.id })}
        members={[organizer, voter]}
        currentMemberId={voter.userId}
        isHolidayMode={false}
        onBack={vi.fn()}
        onVote={onVote}
        onComplete={vi.fn()}
        onStartWeek={vi.fn()}
      />,
    )

    await user.click(screen.getAllByRole('button', { name: 'Vote' })[0])

    expect(onVote).toHaveBeenCalledWith('venue-1')
  })

  it('shows completion once all active members have voted', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const organizer = { ...baseMember, id: 'member-1', userId: 'user-1', name: 'Organizer' }
    const voter = { ...baseMember, id: 'member-2', userId: 'user-2', name: 'Voter' }
    const awayMember = { ...baseMember, id: 'member-3', userId: 'user-3', name: 'Away Member', isAway: true }

    render(
      <VotingScreen
        period={createPeriod({
          organizerId: organizer.id,
          venueOptions: [
            {
              id: 'venue-1',
              name: 'Sushi Place',
              description: 'Fresh rolls',
              votes: [voter.id],
              proposedBy: organizer.id,
            },
            {
              id: 'venue-2',
              name: 'Burger Town',
              description: 'Big burgers',
              votes: [organizer.id],
              proposedBy: voter.id,
            },
          ],
        })}
        members={[organizer, voter, awayMember]}
        currentMemberId={voter.userId}
        isHolidayMode={false}
        onBack={vi.fn()}
        onVote={vi.fn()}
        onComplete={onComplete}
        onStartWeek={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Complete Voting' }))

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('ignores away-member votes when determining completion', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const organizer = { ...baseMember, id: 'member-1', userId: 'user-1', name: 'Organizer' }
    const voter = { ...baseMember, id: 'member-2', userId: 'user-2', name: 'Voter' }
    const awayMember = { ...baseMember, id: 'member-3', userId: 'user-3', name: 'Away Member', isAway: true }

    render(
      <VotingScreen
        period={createPeriod({
          organizerId: organizer.id,
          venueOptions: [
            {
              id: 'venue-1',
              name: 'Sushi Place',
              description: 'Fresh rolls',
              votes: [voter.id, awayMember.id],
              proposedBy: organizer.id,
            },
            {
              id: 'venue-2',
              name: 'Burger Town',
              description: 'Big burgers',
              votes: [organizer.id],
              proposedBy: voter.id,
            },
          ],
        })}
        members={[organizer, voter, awayMember]}
        currentMemberId={voter.userId}
        isHolidayMode={false}
        onBack={vi.fn()}
        onVote={vi.fn()}
        onComplete={onComplete}
        onStartWeek={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Complete Voting' }))

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('saves team name with an async update callback', async () => {
    const user = userEvent.setup()
    const onUpdateTeam = vi.fn().mockResolvedValue(undefined)

    render(
      <SettingsScreen
        team={baseTeam}
        isHolidayMode={false}
        onBack={vi.fn()}
        onToggleHoliday={vi.fn()}
        onUpdateTeam={onUpdateTeam}
      />,
    )

    const teamNameInput = screen.getByPlaceholderText('Engineering Team')
    await user.clear(teamNameInput)
    await user.type(teamNameInput, 'Team Renamed')
    await user.click(screen.getByRole('button', { name: 'Save Team Name' }))

    await waitFor(() => expect(onUpdateTeam).toHaveBeenCalledWith({ name: 'Team Renamed' }))
  })

  it('saves team name with a sync update callback', async () => {
    const user = userEvent.setup()
    const onUpdateTeam = vi.fn()

    render(
      <SettingsScreen
        team={baseTeam}
        isHolidayMode={false}
        onBack={vi.fn()}
        onToggleHoliday={vi.fn()}
        onUpdateTeam={onUpdateTeam}
      />,
    )

    const teamNameInput = screen.getByPlaceholderText('Engineering Team')
    await user.clear(teamNameInput)
    await user.type(teamNameInput, 'Team Synchronous')
    await user.click(screen.getByRole('button', { name: 'Save Team Name' }))

    expect(onUpdateTeam).toHaveBeenCalledWith({ name: 'Team Synchronous' })
  })
})
