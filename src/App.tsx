import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useParams } from 'react-router-dom'
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

function AppRouter() {
  const navigate = useNavigate()
  
  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  
  // Team state
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  
  // Voting state
  const [currentPeriod, setCurrentPeriod] = useState<LunchPeriod | null>(null)
  const [history, setHistory] = useState<LunchPeriod[]>([])
  const [isHolidayMode, setIsHolidayMode] = useState(false)

  // Derived state
  const selectedTeam = selectedTeamId ? teams.find((t) => t.id === selectedTeamId) : null
  const teamMembers = selectedTeamId ? members.filter((m) => m.teamId === selectedTeamId) : []
  const nextOrganizer = getNextOrganizer(teamMembers)
  const currentWeek = Math.ceil((Date.now() - (selectedTeam?.createdAt || Date.now())) / (7 * 24 * 60 * 60 * 1000))

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
          createdAt: t.createdAt,
        })))
      } catch (error) {
        console.error('Failed to load teams:', error)
        toast.error('Failed to load teams')
      }
    }
    loadTeams()
  }, [user])

  // Load team members when team is selected
  const loadTeamData = useCallback(async (teamId: string) => {
    try {
      const [membersRes, periodRes] = await Promise.all([
        teamsAPI.getTeamMembers(teamId),
        votingAPI.getCurrentPeriod(teamId).catch(() => ({ period: null })),
      ])
      
      setMembers(membersRes.members.map(transformMember))
      setCurrentPeriod(periodRes.period ? transformPeriod(periodRes.period) : null)
      
      // Also load history
      try {
        const historyRes = await votingAPI.getPeriodHistory(teamId)
        setHistory(historyRes.periods.map(transformPeriod))
      } catch {
        setHistory([])
      }
    } catch (error) {
      console.error('Failed to load team data:', error)
      toast.error('Failed to load team data')
    }
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      loadTeamData(selectedTeamId)
    }
  }, [selectedTeamId, loadTeamData])

  const handleLogin = (newUser: User) => {
    setUser(newUser)
    navigate('/teams')
  }

  const handleSelectTeam = (team: Team) => {
    setSelectedTeamId(team.id)
    navigate('/dashboard')
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
        createdAt: newTeam.createdAt,
      }
      
      setTeams((prev) => [...prev, transformedTeam])
      setSelectedTeamId(newTeam.id)
      toast.success(`${newTeam.emoji} Fellowship ${newTeam.name} has been forged!`)
      navigate('/dashboard')
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
        createdAt: team.createdAt,
      }
      
      setTeams((prev) => [...prev, transformedTeam])
      setSelectedTeamId(team.id)
      toast.success(`You have joined the ${team.emoji} ${team.name} fellowship!`)
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to join team:', error)
      toast.error('Invalid invite code')
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleTeamSwitch = (teamId: string) => {
    setSelectedTeamId(teamId)
  }

  const handleAddMember = async (name: string) => {
    if (!selectedTeamId) return
    
    try {
      const { member } = await teamsAPI.addMember(selectedTeamId, { name })
      setMembers((prev) => [...prev, transformMember(member)])
      toast.success(`${name} joins the fellowship`)
    } catch (error) {
      console.error('Failed to add member:', error)
      toast.error('Failed to add member')
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
        prev.map((m) => (m.id === memberId ? { ...m, isAway } as TeamMember : m))
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
    if (!currentPeriod) return
    
    try {
      await votingAPI.completePeriod(currentPeriod.id)
      toast.success('🎉 The chapter concludes!')
      
      if (selectedTeamId) {
        await loadTeamData(selectedTeamId)
      }
      navigate('/summary')
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
      navigate('/vote')
    } catch (error) {
      console.error('Failed to start period:', error)
      toast.error('Failed to start new period')
    }
  }

  const handleProposeVenue = async (name: string, description: string) => {
    if (!currentPeriod) return
    
    try {
      await votingAPI.proposeVenue(currentPeriod.id, { name, description })
      // Reload the period to get updated venue list
      const { period } = await votingAPI.getCurrentPeriod(selectedTeamId!)
      if (period) {
        setCurrentPeriod(transformPeriod(period))
      }
      toast.success('Venue proposed! 🍽️')
    } catch (error) {
      console.error('Failed to propose venue:', error)
      toast.error('Failed to propose venue')
    }
  }

  const handleStartVoting = async () => {
    if (!currentPeriod) return
    
    try {
      await votingAPI.startVoting(currentPeriod.id)
      // Reload the period to get updated status
      const { period } = await votingAPI.getCurrentPeriod(selectedTeamId!)
      if (period) {
        setCurrentPeriod(transformPeriod(period))
      }
      toast.success('Voting has begun! 🗳️')
    } catch (error) {
      console.error('Failed to start voting:', error)
      toast.error('Failed to start voting')
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

  const ProfileRoute = () => {
    const { memberId } = useParams<{ memberId: string }>()
    const member = teamMembers.find((m) => m.id === memberId)
    
    if (!member) {
      return <Navigate to="/dashboard" replace />
    }

    const isOwnProfile = member.userId === user?.id

    return (
      <ProfileScreen
        member={member}
        badges={mockBadges}
        userBadges={mockUserBadges}
        isOwnProfile={isOwnProfile}
        onBack={handleBack}
        onUpdateName={isOwnProfile ? (name) => handleUpdateMemberName(member.id, name) : undefined}
        onToggleAway={isOwnProfile && selectedTeamId ? (isAway) => handleToggleMemberAway(member.id, isAway).then(() => {}) : undefined}
      />
    )
  }

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
        path="/dashboard"
        element={
          selectedTeam ? (
            <TeamDashboardScreen
              team={selectedTeam}
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
              onNavigateToVote={() => navigate('/vote')}
              onNavigateToHistory={() => navigate('/summary')}
              onNavigateToProfile={(memberId) => navigate(`/profile/${memberId}`)}
            />
          ) : (
            <Navigate to="/teams" replace />
          )
        }
      />
      <Route
        path="/vote"
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
            onProposeVenue={handleProposeVenue}
            onStartVoting={handleStartVoting}
          />
        }
      />
      <Route
        path="/leaderboard"
        element={
          <LeaderboardScreen
            members={teamMembers}
            onBack={handleBack}
            onSelectMember={(memberId) => navigate(`/profile/${memberId}`)}
          />
        }
      />
      <Route path="/profile/:memberId" element={<ProfileRoute />} />
      <Route
        path="/settings"
        element={
          selectedTeam ? (
            <SettingsScreen
              team={selectedTeam}
              isHolidayMode={isHolidayMode}
              onBack={handleBack}
              onToggleHoliday={handleToggleHoliday}
            />
          ) : (
            <Navigate to="/teams" replace />
          )
        }
      />
      <Route
        path="/summary"
        element={
          <WeeklySummaryScreen
            history={history}
            members={teamMembers}
            onBack={handleBack}
          />
        }
      />
      <Route
        path="/picker"
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
