import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { useConfetti } from '@/hooks/use-confetti'
import { User, Team, TeamMember, LunchPeriod, VenueOption } from '@/lib/types'
import { getNextOrganizer, calculateReputationScore, generateId } from '@/lib/helpers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { LoginScreen } from '@/components/LoginScreen'
import { TeamSelection } from '@/components/TeamSelection'
import { TeamHeader } from '@/components/TeamHeader'
import { MemberCard } from '@/components/MemberCard'
import { AddMemberDialog } from '@/components/AddMemberDialog'
import { ProposeVenueDialog } from '@/components/ProposeVenueDialog'
import { VenueVotingCard } from '@/components/VenueVotingCard'
import { Leaderboard } from '@/components/Leaderboard'
import { HistoryList } from '@/components/HistoryList'
import { Users, CalendarBlank, MapPin, Clock } from '@phosphor-icons/react'
import { toast } from 'sonner'

function App() {
  const [user, setUser] = useKV<User | null>('lunch-user', null)
  const [teams, setTeams] = useKV<Team[]>('lunch-teams', [])
  const [selectedTeamId, setSelectedTeamId] = useKV<string | null>('lunch-selected-team', null)
  const [allMembers, setAllMembers] = useKV<TeamMember[]>('lunch-all-members', [])
  const [allPeriods, setAllPeriods] = useKV<LunchPeriod[]>('lunch-all-periods', [])
  const [allHistory, setAllHistory] = useKV<LunchPeriod[]>('lunch-all-history', [])
  const [holidayModes, setHolidayModes] = useKV<Record<string, boolean>>('lunch-holiday-modes', {})
  const [proposeDialogOpen, setProposeDialogOpen] = useState(false)
  const { triggerConfetti } = useConfetti()

  const safeUser = user || null
  const safeTeams = teams || []
  const safeAllMembers = allMembers || []
  const safeAllPeriods = allPeriods || []
  const safeAllHistory = allHistory || []
  const safeHolidayModes = holidayModes || {}

  const selectedTeam = selectedTeamId ? safeTeams.find(t => t.id === selectedTeamId) : null
  const members = selectedTeamId ? safeAllMembers.filter(m => m.teamId === selectedTeamId) : []
  const currentPeriod = selectedTeamId ? safeAllPeriods.find(p => p.teamId === selectedTeamId && p.status !== 'completed') : null
  const history = selectedTeamId ? safeAllHistory.filter(h => h.teamId === selectedTeamId) : []
  const isHolidayMode = selectedTeamId ? safeHolidayModes[selectedTeamId] || false : false

  const nextOrganizer = getNextOrganizer(members)
  const averagePoints = members.length > 0
    ? Math.round(members.reduce((sum, m) => sum + m.points, 0) / members.length)
    : 0

  const handleLogin = (newUser: User) => {
    setUser(newUser)
  }

  const handleCreateTeam = (team: Team) => {
    setTeams((current) => [...(current || []), team])
    setSelectedTeamId(team.id)
    
    if (safeUser) {
      const ownerMember: TeamMember = {
        id: generateId(),
        teamId: team.id,
        userId: safeUser.id,
        name: safeUser.name,
        points: 0,
        reputationScore: 0,
        totalVenuesProposed: 0,
        totalWins: 0,
        joinedAt: Date.now(),
      }
      setAllMembers((current) => [...(current || []), ownerMember])
    }
  }

  const handleJoinTeam = (inviteCode: string) => {
    const team = safeTeams.find(t => t.inviteCode === inviteCode)
    if (team && safeUser) {
      const existingMember = safeAllMembers.find(
        m => m.teamId === team.id && m.userId === safeUser.id
      )
      
      if (existingMember) {
        toast.error('You are already a member of this team')
        return
      }

      const teamMembers = safeAllMembers.filter(m => m.teamId === team.id)
      const avgPoints = teamMembers.length > 0
        ? Math.round(teamMembers.reduce((sum, m) => sum + m.points, 0) / teamMembers.length)
        : 0

      const newMember: TeamMember = {
        id: generateId(),
        teamId: team.id,
        userId: safeUser.id,
        name: safeUser.name,
        points: avgPoints,
        reputationScore: 0,
        totalVenuesProposed: 0,
        totalWins: 0,
        joinedAt: Date.now(),
      }
      setAllMembers((current) => [...(current || []), newMember])
      setSelectedTeamId(team.id)
      toast.success(`Joined ${team.emoji} ${team.name}!`)
    } else {
      toast.error('Invalid invite code')
    }
  }

  const handleSelectTeam = (team: Team) => {
    setSelectedTeamId(team.id)
  }

  const handleBackToTeams = () => {
    setSelectedTeamId(null)
  }

  const handleAddMember = (name: string) => {
    if (!selectedTeamId || !safeUser) return

    const newMember: TeamMember = {
      id: generateId(),
      teamId: selectedTeamId,
      userId: generateId(),
      name,
      points: averagePoints,
      reputationScore: 0,
      totalVenuesProposed: 0,
      totalWins: 0,
      joinedAt: Date.now(),
    }
    setAllMembers((current) => [...(current || []), newMember])
    toast.success(`${name} added to the roster`)
  }

  const handleRemoveMember = (id: string) => {
    const member = members.find(m => m.id === id)
    if (!member) return

    if (currentPeriod?.organizerId === id) {
      toast.error('Cannot remove the current organizer during an active period')
      return
    }

    setAllMembers((current) => (current || []).filter(m => m.id !== id))
    toast.success(`${member.name} removed from roster`)
  }

  const handleStartPeriod = () => {
    if (!nextOrganizer) {
      toast.error('Add team members first')
      return
    }
    setProposeDialogOpen(true)
  }

  const handleProposeVenues = (venues: VenueOption[]) => {
    if (!nextOrganizer || !selectedTeamId) return

    const period: LunchPeriod = {
      id: generateId(),
      teamId: selectedTeamId,
      organizerId: nextOrganizer.id,
      startDate: Date.now(),
      endDate: null,
      venueOptions: venues,
      winningVenueId: null,
      status: 'voting',
      votingDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }

    setAllPeriods((current) => [...(current || []).filter(p => p.teamId !== selectedTeamId), period])
    setAllMembers((current) =>
      (current || []).map(m =>
        m.id === nextOrganizer.id
          ? { ...m, totalVenuesProposed: m.totalVenuesProposed + 1 }
          : m
      )
    )
    toast.success('Voting has started! 🗳️')
  }

  const handleVote = (venueId: string) => {
    if (!currentPeriod || !safeUser) return

    const currentUserMember = members.find(m => m.userId === safeUser.id)
    if (!currentUserMember) {
      toast.error('You must be a team member to vote')
      return
    }

    const alreadyVoted = currentPeriod.venueOptions.some(v => v.votes.includes(currentUserMember.id))
    if (alreadyVoted) {
      toast.error('You have already voted')
      return
    }

    const updatedPeriod: LunchPeriod = {
      ...currentPeriod,
      venueOptions: currentPeriod.venueOptions.map(v =>
        v.id === venueId ? { ...v, votes: [...v.votes, currentUserMember.id] } : v
      ),
    }

    setAllPeriods((current) =>
      (current || []).map(p => p.id === updatedPeriod.id ? updatedPeriod : p)
    )
    toast.success('Vote recorded! ✨')
  }

  const handleCompletePeriod = () => {
    if (!currentPeriod || !selectedTeamId) return

    const sortedVenues = [...currentPeriod.venueOptions].sort(
      (a, b) => b.votes.length - a.votes.length
    )
    const winner = sortedVenues[0]

    const completedPeriod: LunchPeriod = {
      ...currentPeriod,
      winningVenueId: winner.id,
      status: 'completed',
      endDate: Date.now(),
    }

    const totalVotes = currentPeriod.venueOptions.reduce((sum, v) => sum + v.votes.length, 0)

    setAllHistory((current) => [completedPeriod, ...(current || [])])
    setAllPeriods((current) => (current || []).filter(p => p.id !== currentPeriod.id))
    
    setAllMembers((current) =>
      (current || []).map(m => {
        if (m.id === currentPeriod.organizerId) {
          const newReputation = calculateReputationScore(
            totalVotes,
            m.totalVenuesProposed
          )
          const isWinner = winner.proposedBy === m.id
          return {
            ...m,
            points: m.points + 1,
            reputationScore: newReputation,
            totalWins: isWinner ? m.totalWins + 1 : m.totalWins,
          }
        }
        return m
      })
    )

    triggerConfetti()
    toast.success(`🎉 ${winner.name} won with ${winner.votes.length} ${winner.votes.length === 1 ? 'vote' : 'votes'}!`)
  }

  const handleToggleHoliday = (checked: boolean) => {
    if (!selectedTeamId) return
    setHolidayModes((current) => ({ ...(current || {}), [selectedTeamId]: checked }))
    toast.success(checked ? '🏖️ Holiday mode enabled' : 'Holiday mode disabled')
  }

  if (!safeUser) {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (!selectedTeam) {
    return (
      <TeamSelection
        user={safeUser}
        teams={safeTeams}
        onSelectTeam={handleSelectTeam}
        onCreateTeam={handleCreateTeam}
        onJoinTeam={handleJoinTeam}
      />
    )
  }

  const userMember = members.find(m => m.userId === safeUser.id)
  const userHasVoted = currentPeriod?.venueOptions.some(v => userMember && v.votes.includes(userMember.id)) || false
  const totalVotes = currentPeriod?.venueOptions.reduce((sum, v) => sum + v.votes.length, 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <TeamHeader 
          team={selectedTeam} 
          user={safeUser} 
          memberCount={members.length}
          onBack={handleBackToTeams}
        />

        <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-3">
            <Switch
              id="holiday-mode"
              checked={isHolidayMode}
              onCheckedChange={handleToggleHoliday}
            />
            <Label htmlFor="holiday-mode" className="cursor-pointer">
              Holiday Break Mode
              {isHolidayMode && <Badge className="ml-2" variant="secondary">Active</Badge>}
            </Label>
          </div>
          {nextOrganizer && !isHolidayMode && !currentPeriod && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Next: <span className="font-medium text-foreground">{nextOrganizer.name}</span>
              </span>
              <Button onClick={handleStartPeriod} size="sm">
                Start This Week
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="roster" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="roster" className="gap-2">
              <Users size={16} />
              Roster
            </TabsTrigger>
            <TabsTrigger value="vote" className="gap-2">
              <MapPin size={16} />
              Vote
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock size={16} />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roster" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
                Team Members
              </h2>
              <AddMemberDialog onAdd={handleAddMember} averagePoints={averagePoints} />
            </div>

            {members.length === 0 ? (
              <Card className="p-12 text-center">
                <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">No team members yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first team member to start the lunch rotation
                </p>
                <AddMemberDialog onAdd={handleAddMember} averagePoints={averagePoints} />
              </Card>
            ) : (
              <>
                <div className="grid gap-3">
                  {members
                    .sort((a, b) => a.points - b.points)
                    .map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        isNextOrganizer={member.id === nextOrganizer?.id}
                        onRemove={handleRemoveMember}
                      />
                    ))}
                </div>

                <Separator />

                <Leaderboard members={members} />
              </>
            )}
          </TabsContent>

          <TabsContent value="vote" className="space-y-6">
            {!currentPeriod ? (
              <Card className="p-12 text-center">
                <CalendarBlank size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">No active voting</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isHolidayMode
                    ? 'Holiday mode is active. Disable it to start a new lunch period.'
                    : nextOrganizer
                    ? `${nextOrganizer.name} is up next. Start the week to begin voting.`
                    : 'Add team members to start organizing lunches.'}
                </p>
                {nextOrganizer && !isHolidayMode && (
                  <Button onClick={handleStartPeriod}>Start This Week</Button>
                )}
              </Card>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold mb-1" style={{ letterSpacing: '-0.01em' }}>
                      Vote for This Week's Venue
                    </h2>
                    <p className="text-muted-foreground">
                      Organized by {members.find(m => m.id === currentPeriod.organizerId)?.name}
                    </p>
                  </div>
                  {userHasVoted && (
                    <Button onClick={handleCompletePeriod} variant="outline">
                      Complete Voting
                    </Button>
                  )}
                </div>

                {totalVotes > 0 && (
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <p className="text-sm">
                      <span className="font-medium">{totalVotes}</span> {totalVotes === 1 ? 'vote' : 'votes'} cast so far
                    </p>
                  </Card>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {currentPeriod.venueOptions.map((venue) => (
                    <VenueVotingCard
                      key={venue.id}
                      venue={venue}
                      hasVoted={userHasVoted}
                      userVotedForThis={userMember ? venue.votes.includes(userMember.id) : false}
                      onVote={handleVote}
                      showResults={userHasVoted}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <h2 className="text-2xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
              Past Lunches
            </h2>
            <HistoryList history={history} members={members} />
          </TabsContent>
        </Tabs>
      </div>

      <ProposeVenueDialog
        open={proposeDialogOpen}
        onClose={() => setProposeDialogOpen(false)}
        onSubmit={handleProposeVenues}
        organizerName={nextOrganizer?.name || ''}
        organizerId={nextOrganizer?.id || ''}
      />
    </div>
  )
}

export default App
