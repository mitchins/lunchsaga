import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { User, Team, TeamMember } from '@/lib/types'
import { getNextOrganizer, generateId } from '@/lib/helpers'
import { LoginScreen } from '@/screens/LoginScreen'
import { TeamSelectionScreen } from '@/screens/TeamSelectionScreen'
import { TeamDashboardScreen } from '@/screens/TeamDashboardScreen'
import { VotingScreen } from '@/screens/VotingScreen'
import { LeaderboardScreen } from '@/screens/LeaderboardScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { WeeklySummaryScreen } from '@/screens/WeeklySummaryScreen'
import { WeeklyPickerScreen } from '@/screens/WeeklyPickerScreen'
import {
  mockUser,
  mockTeams,
  mockMembers,
  mockCurrentPeriod,
  mockHistory,
  mockBadges,
  mockUserBadges,
} from '@/mocks'
import { toast } from 'sonner'

function AppRouter() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [teams] = useState<Team[]>(mockTeams)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [members] = useState<TeamMember[]>(mockMembers)
  const [currentPeriod, setCurrentPeriod] = useState(mockCurrentPeriod)
  const [history] = useState(mockHistory)
  const [isHolidayMode, setIsHolidayMode] = useState(false)

  const selectedTeam = selectedTeamId ? teams.find((t) => t.id === selectedTeamId) : null
  const teamMembers = selectedTeamId ? members.filter((m) => m.teamId === selectedTeamId) : []
  const nextOrganizer = getNextOrganizer(teamMembers)
  const currentWeek = Math.ceil((Date.now() - (selectedTeam?.createdAt || Date.now())) / (7 * 24 * 60 * 60 * 1000))

  const handleLogin = (newUser: User) => {
    setUser(newUser)
    navigate('/teams')
  }

  const handleSelectTeam = (team: Team) => {
    setSelectedTeamId(team.id)
    navigate('/dashboard')
  }

  const handleCreateTeam = (team: Team) => {
    toast.success(`${team.emoji} ${team.name} created!`)
    setSelectedTeamId(team.id)
    navigate('/dashboard')
  }

  const handleJoinTeam = (inviteCode: string) => {
    const team = teams.find((t) => t.inviteCode === inviteCode)
    if (team) {
      toast.success(`Joined ${team.emoji} ${team.name}!`)
      setSelectedTeamId(team.id)
      navigate('/dashboard')
    } else {
      toast.error('Invalid invite code')
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleTeamSwitch = (teamId: string) => {
    setSelectedTeamId(teamId)
  }

  const handleAddMember = (name: string) => {
    toast.success(`${name} added to the roster`)
  }

  const handleRemoveMember = (id: string) => {
    toast.success('Member removed from roster')
  }

  const handleToggleHoliday = (checked: boolean) => {
    setIsHolidayMode(checked)
    toast.success(checked ? '🏖️ Holiday mode enabled' : 'Holiday mode disabled')
  }

  const handleToggleMemberAway = (memberId: string, isAway: boolean) => {
    const member = members.find((m) => m.id === memberId)
    if (member) {
      toast.success(isAway ? `${member.name} marked as away` : `${member.name} is back!`)
    }
  }

  const handleVote = (venueId: string) => {
    if (!currentPeriod) return
    toast.success('Vote recorded! ✨')
  }

  const handleCompletePeriod = () => {
    toast.success('🎉 Voting completed!')
    navigate('/summary')
  }

  const handleStartWeek = () => {
    toast.success('Week started!')
    navigate('/vote')
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
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
      <Route
        path="/profile/:memberId"
        element={
          <ProfileScreen
            member={teamMembers[0]} // Mock: would use memberId from route params
            badges={mockBadges}
            userBadges={mockUserBadges}
            onBack={handleBack}
          />
        }
      />
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
