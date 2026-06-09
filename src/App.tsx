import { useState, useEffect, useCallback, useRef } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
  useMatch,
  useNavigate,
} from 'react-router-dom'
import { User, Team, TeamMember, LunchPeriod } from '@/lib/types'
import { getNextOrganizer } from '@/lib/helpers'
import { LoginScreen } from '@/screens/LoginScreen'
import { TeamSelectionScreen } from '@/screens/TeamSelectionScreen'
import { TeamDashboardScreen } from '@/screens/TeamDashboardScreen'
import { VotingScreen } from '@/screens/VotingScreen'
import { LeaderboardScreen } from '@/screens/LeaderboardScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { WeeklySummaryScreen } from '@/screens/WeeklySummaryScreen'
import { WeeklyPickerScreen } from '@/screens/WeeklyPickerScreen'
import { mockBadges, mockUserBadges } from '@/mocks/badges'
import { toast } from 'sonner'
import {
  authAPI,
  teamsAPI,
  votingAPI,
  membersAPI,
  getToken,
  clearToken,
  type TeamMember as APITeamMember,
  type LunchPeriod as APILunchPeriod,
} from '@/services/api'

// Loading spinner component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your saga...</p>
      </div>
    </div>
  )
}

// Transform API types to frontend types
function transformMember(m: APITeamMember): TeamMember {
  return {
    id: m.id,
    teamId: m.teamId,
    userId: m.userId,
    name: m.name,
    points: m.points,
    reputationScore: m.reputationScore,
    totalVenuesProposed: m.totalVenuesProposed,
    totalWins: m.totalWins,
    isAway: m.isAway,
    joinedAt: m.joinedAt,
  }
}

function transformPeriod(p: APILunchPeriod): LunchPeriod {
  return {
    id: p.id,
    teamId: p.teamId,
    organizerId: p.organizerId,
    startDate: p.startDate,
    endDate: p.endDate,
    venueOptions: p.venueOptions,
    winningVenueId: p.winningVenueId,
    status: p.status,
    votingDeadline: p.votingDeadline,
  }
}

interface ProfileRouteProps {
  readonly teamMembers: TeamMember[]
  readonly teamDataReady: boolean
  readonly user: User
  readonly onBack: () => void
  readonly onUpdateName: (memberId: string, name: string) => Promise<void>
  readonly onToggleAway: (memberId: string, isAway: boolean) => Promise<void>
}

function ProfileRoute({
  teamMembers,
  teamDataReady,
  user,
  onBack,
  onUpdateName,
  onToggleAway,
}: ProfileRouteProps) {
  const { teamId, memberId } = useParams<{ teamId: string; memberId: string }>()

  if (!teamDataReady) {
    return <LoadingScreen />
  }

  const member = teamMembers.find((candidate) => candidate.id === memberId)

  if (!member) {
    return <Navigate to={teamId ? `/dashboard/${teamId}` : '/teams'} replace />
  }

  const isOwnProfile = member.userId === user.id

  return (
    <ProfileScreen
      member={member}
      badges={mockBadges}
      userBadges={mockUserBadges}
      isOwnProfile={isOwnProfile}
      onBack={onBack}
      onUpdateName={isOwnProfile ? (name) => onUpdateName(member.id, name) : undefined}
      onToggleAway={isOwnProfile ? (isAway) => onToggleAway(member.id, isAway) : undefined}
    />
  )
}

interface TeamDashboardRouteProps {
  readonly team: Team | null
  readonly selectedTeamId: string | null
  readonly isTeamListReady: boolean
  readonly teams: Team[]
  readonly members: TeamMember[]
  readonly currentUserMemberId?: string
  readonly nextOrganizer: TeamMember | null
  readonly isHolidayMode: boolean
  readonly onBack: () => void
  readonly onTeamSwitch: (teamId: string) => void
  readonly onAddMember: (email: string) => Promise<void>
  readonly onRemoveMember: (memberId: string) => Promise<void>
  readonly onToggleHoliday: (checked: boolean) => Promise<void>
  readonly onToggleMemberAway: (memberId: string, isAway: boolean) => Promise<void>
  readonly onNavigateToVote: () => void
  readonly onNavigateToHistory: () => void
  readonly onNavigateToProfile: (memberId: string) => void
}

function TeamDashboardRoute({
  team,
  selectedTeamId,
  isTeamListReady,
  teams,
  members,
  currentUserMemberId,
  nextOrganizer,
  isHolidayMode,
  onBack,
  onTeamSwitch,
  onAddMember,
  onRemoveMember,
  onToggleHoliday,
  onToggleMemberAway,
  onNavigateToVote,
  onNavigateToHistory,
  onNavigateToProfile,
}: TeamDashboardRouteProps) {
  if (selectedTeamId && !isTeamListReady) {
    return <LoadingScreen />
  }

  if (!team) {
    return <Navigate to="/teams" replace />
  }

  return (
    <TeamDashboardScreen
      team={team}
      teams={teams}
      members={members}
      currentUserMemberId={currentUserMemberId}
      nextOrganizer={nextOrganizer}
      isHolidayMode={isHolidayMode}
      onBack={onBack}
      onTeamSwitch={onTeamSwitch}
      onAddMember={onAddMember}
      onRemoveMember={onRemoveMember}
      onToggleHoliday={onToggleHoliday}
      onToggleMemberAway={onToggleMemberAway}
      onNavigateToVote={onNavigateToVote}
      onNavigateToHistory={onNavigateToHistory}
      onNavigateToProfile={onNavigateToProfile}
    />
  )
}

interface SettingsRouteProps {
  readonly team: Team | null
  readonly selectedTeamId: string | null
  readonly isTeamListReady: boolean
  readonly isHolidayMode: boolean
  readonly onBack: () => void
  readonly onToggleHoliday: (checked: boolean) => Promise<void>
  readonly onUpdateTeam: (updates: Partial<Team>) => Promise<void>
}

function SettingsRoute({
  team,
  selectedTeamId,
  isTeamListReady,
  isHolidayMode,
  onBack,
  onToggleHoliday,
  onUpdateTeam,
}: SettingsRouteProps) {
  if (selectedTeamId && !isTeamListReady) {
    return <LoadingScreen />
  }

  if (!team) {
    return <Navigate to="/teams" replace />
  }

  return (
    <SettingsScreen
      team={team}
      isHolidayMode={isHolidayMode}
      onBack={onBack}
      onToggleHoliday={onToggleHoliday}
      onUpdateTeam={onUpdateTeam}
    />
  )
}

function AppRouter() {
  const navigate = useNavigate()
  const dashboardMatch = useMatch('/dashboard/:teamId')
  const voteMatch = useMatch('/vote/:teamId')
  const leaderboardMatch = useMatch('/leaderboard/:teamId')
  const profileMatch = useMatch('/profile/:teamId/:memberId')
  const settingsMatch = useMatch('/settings/:teamId')
  const summaryMatch = useMatch('/summary/:teamId')
  const pickerMatch = useMatch('/picker/:teamId')

  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  
  // Team state
  const [teams, setTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isTeamDataLoading, setIsTeamDataLoading] = useState(false)
  const [loadedTeamDataId, setLoadedTeamDataId] = useState<string | null>(null)
  const [isTeamListReady, setIsTeamListReady] = useState(false)
  const latestTeamDataRequestRef = useRef(0)
  
  // Voting state
  const [currentPeriod, setCurrentPeriod] = useState<LunchPeriod | null>(null)
  const [history, setHistory] = useState<LunchPeriod[]>([])
  const [isHolidayMode, setIsHolidayMode] = useState(false)

  const selectedTeamId =
    dashboardMatch?.params.teamId ||
    voteMatch?.params.teamId ||
    leaderboardMatch?.params.teamId ||
    profileMatch?.params.teamId ||
    settingsMatch?.params.teamId ||
    summaryMatch?.params.teamId ||
    pickerMatch?.params.teamId ||
    null

  // Derived state
  const selectedTeam = selectedTeamId ? teams.find((t) => t.id === selectedTeamId) ?? null : null
  const teamMembers = selectedTeamId ? members.filter((m) => m.teamId === selectedTeamId) : []
  const nextOrganizer = getNextOrganizer(teamMembers)
  const isSelectedTeamDataReady = selectedTeamId !== null && loadedTeamDataId === selectedTeamId && !isTeamDataLoading
  const currentWeek = Math.ceil((Date.now() - (selectedTeam?.createdAt || Date.now())) / (7 * 24 * 60 * 60 * 1000))

  useEffect(() => {
    if (selectedTeam) {
      setIsHolidayMode(selectedTeam.isHolidayMode)
    }
  }, [selectedTeam?.id, selectedTeam?.isHolidayMode])

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      const token = getToken()
      if (!token) {
        setAuthChecked(true)
        setIsLoading(false)
        return
      }

      try {
        const { user: apiUser } = await authAPI.getMe()
        setUser({
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.name,
          avatar: apiUser.avatar || undefined,
          createdAt: Date.now(),
        })
      } catch (error) {
        console.error('Auth check failed:', error)
        clearToken()
      } finally {
        setAuthChecked(true)
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Load teams when user is authenticated
  useEffect(() => {
    if (!user) return
    setIsTeamListReady(false)
    
    async function loadTeams() {
      try {
        const { teams: apiTeams } = await teamsAPI.getTeams()
        setTeams(apiTeams.map(t => ({
          id: t.id,
          name: t.name,
          emoji: t.emoji,
          color: t.color,
          ownerId: t.ownerId,
          inviteCode: t.inviteCode,
          isHolidayMode: t.isHolidayMode,
          createdAt: t.createdAt,
        })))
      } catch (error) {
        console.error('Failed to load teams:', error)
        toast.error('Failed to load teams')
      } finally {
        setIsTeamListReady(true)
      }
    }
    loadTeams()
  }, [user])

  // Load team members when team is selected
  const loadTeamData = useCallback(async (teamId: string) => {
    const requestId = ++latestTeamDataRequestRef.current
    setIsTeamDataLoading(true)
    let didSucceed = false

    try {
      const [membersRes, periodRes] = await Promise.all([
        teamsAPI.getTeamMembers(teamId),
        votingAPI.getCurrentPeriod(teamId).catch(() => ({ period: null })),
      ])

      if (requestId !== latestTeamDataRequestRef.current) {
        return
      }
      
      setMembers(membersRes.members.map(transformMember))
      setCurrentPeriod(periodRes.period ? transformPeriod(periodRes.period) : null)
      
      // Also load history
      try {
        const historyRes = await votingAPI.getPeriodHistory(teamId)

        if (requestId !== latestTeamDataRequestRef.current) {
          return
        }

        setHistory(historyRes.periods.map(transformPeriod))
      } catch {
        if (requestId !== latestTeamDataRequestRef.current) {
          return
        }

        setHistory([])
      }

      didSucceed = true
    } catch (error) {
      console.error('Failed to load team data:', error)
      toast.error('Failed to load team data')
    } finally {
      if (requestId === latestTeamDataRequestRef.current) {
        setLoadedTeamDataId(didSucceed ? teamId : null)
        setIsTeamDataLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      setLoadedTeamDataId(null)
      loadTeamData(selectedTeamId)
    } else {
      setLoadedTeamDataId(null)
    }
  }, [selectedTeamId, loadTeamData])

  const handleLogin = (newUser: User) => {
    setUser(newUser)
    navigate('/teams')
  }

  const handleSelectTeam = (team: Team) => {
    navigate(`/dashboard/${team.id}`)
  }

  const handleCreateTeam = async (team: Team) => {
    try {
      const { team: newTeam } = await teamsAPI.createTeam({
        name: team.name,
        emoji: team.emoji,
        color: team.color,
      })
      
      const transformedTeam: Team = {
        id: newTeam.id,
        name: newTeam.name,
        emoji: newTeam.emoji,
        color: newTeam.color,
        ownerId: newTeam.ownerId,
        inviteCode: newTeam.inviteCode,
        isHolidayMode: newTeam.isHolidayMode,
        createdAt: newTeam.createdAt,
      }
      
      setTeams((prev) => [...prev, transformedTeam])
      toast.success(`${newTeam.emoji} Fellowship ${newTeam.name} has been forged!`)
      navigate(`/dashboard/${newTeam.id}`)
    } catch (error) {
      console.error('Failed to create team:', error)
      toast.error('Failed to create team')
    }
  }

  const handleJoinTeam = async (inviteCode: string) => {
    try {
      const { team } = await teamsAPI.joinTeam(inviteCode)
      
      const transformedTeam: Team = {
        id: team.id,
        name: team.name,
        emoji: team.emoji,
        color: team.color,
        ownerId: team.ownerId,
        inviteCode: team.inviteCode,
        isHolidayMode: team.isHolidayMode,
        createdAt: team.createdAt,
      }
      
      setTeams((prev) => [...prev, transformedTeam])
      toast.success(`You have joined the ${team.emoji} ${team.name} fellowship!`)
      navigate(`/dashboard/${team.id}`)
    } catch (error) {
      console.error('Failed to join team:', error)
      toast.error('Invalid invite code')
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleTeamSwitch = (teamId: string) => {
    navigate(`/dashboard/${teamId}`)
  }

  const handleAddMember = async (email: string) => {
    if (!selectedTeamId) return
    
    try {
      const { member } = await teamsAPI.addMember(selectedTeamId, { email })
      setMembers((prev) => [...prev, transformMember(member)])
      toast.success(`${member.name} joins the fellowship`)
    } catch (error) {
      console.error('Failed to add member:', error)
      toast.error('Failed to add member')
    }
  }

  const handleUpdateTeam = async (updates: Partial<Team>) => {
    if (!selectedTeamId) return

    try {
      const { team: updatedTeam } = await teamsAPI.updateTeam(selectedTeamId, updates)
      setTeams((prev) =>
        prev.map((team) =>
          team.id === selectedTeamId
            ? {
                ...team,
                ...updatedTeam,
              }
            : team
        )
      )
      if (typeof updatedTeam.isHolidayMode === 'boolean') {
        setIsHolidayMode(updatedTeam.isHolidayMode)
      }
      toast.success('Team settings updated')
    } catch (error) {
      console.error('Failed to update team:', error)
      toast.error('Failed to update team settings')
    }
  }

  const handleUpdateMemberName = async (memberId: string, name: string) => {
    if (!selectedTeamId) return
    
    const { member } = await membersAPI.updateName(selectedTeamId, memberId, name)
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? transformMember(member) : m))
    )
  }

  const handleRemoveMember = async (id: string) => {
    if (!selectedTeamId) return
    
    try {
      await teamsAPI.removeMember(selectedTeamId, id)
      setMembers((prev) => prev.filter((m) => m.id !== id))
      toast.success('Member has departed the fellowship')
    } catch (error) {
      console.error('Failed to remove member:', error)
      toast.error('Failed to remove member')
    }
  }

  const handleToggleHoliday = async (checked: boolean) => {
    if (!selectedTeamId) return
    
    try {
      await teamsAPI.updateTeam(selectedTeamId, { isHolidayMode: checked })
      setTeams((prev) =>
        prev.map((team) =>
          team.id === selectedTeamId ? { ...team, isHolidayMode: checked } : team
        )
      )
      setIsHolidayMode(checked)
      toast.success(checked ? '🏖️ The saga pauses for rest' : 'The saga continues!')
    } catch (error) {
      console.error('Failed to toggle holiday mode:', error)
      toast.error('Failed to update holiday mode')
    }
  }

  const handleToggleMemberAway = async (memberId: string, isAway: boolean) => {
    if (!selectedTeamId) return
    
    try {
      await teamsAPI.updateMember(selectedTeamId, memberId, { isAway })
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, isAway } : m))
      )
      const member = members.find((m) => m.id === memberId)
      if (member) {
        toast.success(isAway ? `${member.name} embarks on a journey` : `${member.name} returns to the fellowship!`)
      }
    } catch (error) {
      console.error('Failed to update member:', error)
      toast.error('Failed to update member status')
    }
  }

  const handleVote = async (venueId: string) => {
    if (!currentPeriod) return
    
    try {
      const { period } = await votingAPI.castVote(currentPeriod.id, venueId)
      setCurrentPeriod(transformPeriod(period))
      toast.success('Your vote has been cast! ✨')
    } catch (error) {
      console.error('Failed to cast vote:', error)
      toast.error('Failed to cast vote')
    }
  }

  const handleCompletePeriod = async () => {
    if (!currentPeriod || !selectedTeamId) return
    
    try {
      await votingAPI.completePeriod(currentPeriod.id)
      toast.success('🎉 The chapter concludes!')
      
      await loadTeamData(selectedTeamId)
      navigate(`/summary/${selectedTeamId}`)
    } catch (error) {
      console.error('Failed to complete period:', error)
      toast.error('Failed to complete voting period')
    }
  }

  const handleStartWeek = async () => {
    if (!selectedTeamId) return
    
    try {
      const { period } = await votingAPI.startPeriod(selectedTeamId)
      setCurrentPeriod(transformPeriod(period))
      toast.success('A new chapter begins!')
      navigate(`/vote/${selectedTeamId}`)
    } catch (error) {
      console.error('Failed to start period:', error)
      toast.error('Failed to start new period')
    }
  }

  // Show loading while checking auth
  if (isLoading || !authChecked) {
    return <LoadingScreen />
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  // Find the current user's member record in the selected team
  const currentUserMember = teamMembers.find((m) => m.userId === user.id)

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/teams" replace />} />
      <Route
        path="/teams"
        element={
          <TeamSelectionScreen
            user={user}
            teams={teams}
            onSelectTeam={handleSelectTeam}
            onCreateTeam={handleCreateTeam}
            onJoinTeam={handleJoinTeam}
          />
        }
      />
      <Route
        path="/dashboard/:teamId"
        element={
          <TeamDashboardRoute
            team={selectedTeam}
            selectedTeamId={selectedTeamId}
            isTeamListReady={isTeamListReady}
            teams={teams}
            members={teamMembers}
            currentUserMemberId={currentUserMember?.id}
            nextOrganizer={nextOrganizer}
            isHolidayMode={isHolidayMode}
            onBack={() => navigate('/teams')}
            onTeamSwitch={handleTeamSwitch}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onToggleHoliday={handleToggleHoliday}
            onToggleMemberAway={handleToggleMemberAway}
            onNavigateToVote={() => navigate(`/vote/${selectedTeam?.id}`)}
            onNavigateToHistory={() => navigate(`/summary/${selectedTeam?.id}`)}
            onNavigateToProfile={(memberId) => navigate(`/profile/${selectedTeam?.id}/${memberId}`)}
          />
        }
      />
      <Route
        path="/vote/:teamId"
        element={
          <VotingScreen
            period={currentPeriod}
            members={teamMembers}
            currentMemberId={user.id}
            isHolidayMode={isHolidayMode}
            onBack={handleBack}
            onVote={handleVote}
            onComplete={handleCompletePeriod}
            onStartWeek={handleStartWeek}
          />
        }
      />
      <Route
        path="/leaderboard/:teamId"
        element={
          <LeaderboardScreen
            members={teamMembers}
            onBack={handleBack}
            onSelectMember={(memberId) => navigate(`/profile/${selectedTeamId}/${memberId}`)}
          />
        }
      />
      <Route
        path="/profile/:teamId/:memberId"
        element={
          <ProfileRoute
            teamMembers={teamMembers}
            teamDataReady={isSelectedTeamDataReady}
            user={user}
            onBack={handleBack}
            onUpdateName={handleUpdateMemberName}
            onToggleAway={handleToggleMemberAway}
          />
        }
      />
      <Route
        path="/settings/:teamId"
        element={
          <SettingsRoute
            team={selectedTeam}
            selectedTeamId={selectedTeamId}
            isTeamListReady={isTeamListReady}
            isHolidayMode={isHolidayMode}
            onBack={handleBack}
            onToggleHoliday={handleToggleHoliday}
            onUpdateTeam={handleUpdateTeam}
          />
        }
      />
      <Route
        path="/summary/:teamId"
        element={
          <WeeklySummaryScreen
            history={history}
            members={teamMembers}
            onBack={handleBack}
          />
        }
      />
      <Route
        path="/picker/:teamId"
        element={
          <WeeklyPickerScreen
            members={teamMembers}
            nextOrganizer={nextOrganizer}
            currentWeek={currentWeek}
            onBack={handleBack}
            onStartWeek={handleStartWeek}
          />
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}

export default App
