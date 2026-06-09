import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock all API modules FIRST before importing App
vi.mock('@/services/api', () => ({
  getToken: () => 'mock-token',
  clearToken: vi.fn(),
  authAPI: {
    getMe: vi.fn(),
  },
  teamsAPI: {
    getTeams: vi.fn().mockResolvedValue([]),
    getTeam: vi.fn().mockResolvedValue(null),
    createTeam: vi.fn(),
    joinTeam: vi.fn(),
    updateTeam: vi.fn(),
    getTeamMembers: vi.fn().mockResolvedValue({ members: [] }),
    addMember: vi.fn(),
    removeMember: vi.fn(),
  },
  votingAPI: {
    getCurrentPeriod: vi.fn().mockResolvedValue({ period: null }),
    getPeriodHistory: vi.fn().mockResolvedValue({ periods: [] }),
    completePeriod: vi.fn(),
    startPeriod: vi.fn(),
    castVote: vi.fn(),
  },
  membersAPI: {
    updateName: vi.fn(),
  },
}))

vi.mock('@/screens/LoginScreen', () => ({
  LoginScreen: () => <div>Login screen</div>,
}))

vi.mock('@/screens/TeamSelectionScreen', () => ({
  TeamSelectionScreen: () => <div>Teams</div>,
}))

vi.mock('@/screens/TeamDashboardScreen', () => ({
  TeamDashboardScreen: () => <div>Team Dashboard</div>,
}))

vi.mock('@/screens/VotingScreen', () => ({
  VotingScreen: () => <div>Voting</div>,
}))

vi.mock('@/screens/LeaderboardScreen', () => ({
  LeaderboardScreen: () => <div>Leaderboard</div>,
}))

vi.mock('@/screens/ProfileScreen', () => ({
  ProfileScreen: () => <div>Profile</div>,
}))

vi.mock('@/screens/SettingsScreen', () => ({
  SettingsScreen: () => <div>Team Settings</div>,
}))

vi.mock('@/screens/WeeklySummaryScreen', () => ({
  WeeklySummaryScreen: () => <div>Summary</div>,
}))

vi.mock('@/screens/WeeklyPickerScreen', () => ({
  WeeklyPickerScreen: () => <div>Picker</div>,
}))

// Now import App after mocks are set up
import App from '@/App'
import { authAPI, teamsAPI, votingAPI } from '@/services/api'

describe('App Component', () => {
  it('shows loading while resolving a team route before teams are ready', async () => {
    let resolveTeams = (_value: unknown) => {}
    const teamsPromise = new Promise((resolve) => {
      resolveTeams = resolve
    })

    vi.mocked(authAPI.getMe).mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        createdAt: 1,
      },
    })
    vi.mocked(teamsAPI.getTeams).mockReturnValue(teamsPromise as Promise<{ teams: { id: string; name: string; emoji: string; color: string; ownerId: string; inviteCode: string; isHolidayMode: boolean; createdAt: number }[] }>)
    vi.mocked(teamsAPI.getTeamMembers).mockResolvedValue({ members: [] })
    vi.mocked(votingAPI.getCurrentPeriod).mockResolvedValue({ period: null })
    vi.mocked(votingAPI.getPeriodHistory).mockResolvedValue({ periods: [] })

    window.history.pushState({}, '', '/dashboard/team-1')

    const { container } = render(<App />)
    expect(screen.getByText('Loading your saga...')).toBeInTheDocument()

    resolveTeams({
      teams: [
        {
          id: 'team-1',
          name: 'Team Uno',
          emoji: '🧋',
          color: '#00ff00',
          ownerId: 'user-1',
          inviteCode: 'ABC123',
          isHolidayMode: false,
          createdAt: Date.now(),
        },
      ],
    })

    await waitFor(() => {
      expect(screen.getByText('Team Dashboard')).toBeInTheDocument()
    })

    expect(container).toBeTruthy()
  })

  it('App component exports a valid component', () => {
    expect(App).toBeDefined()
    expect(typeof App).toBe('function')
  })

  it('renders team settings route once teams are loaded', async () => {
    vi.mocked(authAPI.getMe).mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        createdAt: 1,
      },
    })
    vi.mocked(teamsAPI.getTeams).mockResolvedValue({
      teams: [
        {
          id: 'team-1',
          name: 'Team Uno',
          emoji: '🧋',
          color: '#00ff00',
          ownerId: 'user-1',
          inviteCode: 'ABC123',
          isHolidayMode: false,
          createdAt: Date.now(),
        },
      ],
    })
    vi.mocked(teamsAPI.getTeamMembers).mockResolvedValue({ members: [] })
    vi.mocked(votingAPI.getCurrentPeriod).mockResolvedValue({ period: null })
    vi.mocked(votingAPI.getPeriodHistory).mockResolvedValue({ periods: [] })

    window.history.pushState({}, '', '/settings/team-1')

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Team Settings')).toBeInTheDocument()
    })
  })
})
