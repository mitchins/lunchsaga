import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { TeamMember, LunchPeriod, VenueOption } from '@/lib/types'
import { getNextOrganizer, calculateReputationScore, generateId } from '@/lib/helpers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { MemberCard } from '@/components/MemberCard'
import { AddMemberDialog } from '@/components/AddMemberDialog'
import { ProposeVenueDialog } from '@/components/ProposeVenueDialog'
import { VenueVotingCard } from '@/components/VenueVotingCard'
import { Leaderboard } from '@/components/Leaderboard'
import { HistoryList } from '@/components/HistoryList'
import { Users, CalendarBlank, MapPin, Clock, SkipForward } from '@phosphor-icons/react'
import { toast } from 'sonner'

function App() {
  const [members, setMembers] = useKV<TeamMember[]>('lunch-members', [])
  const [currentPeriod, setCurrentPeriod] = useKV<LunchPeriod | null>('lunch-current-period', null)
  const [history, setHistory] = useKV<LunchPeriod[]>('lunch-history', [])
  const [isHolidayMode, setIsHolidayMode] = useKV<boolean>('lunch-holiday-mode', false)
  const [currentUserId] = useKV<string>('lunch-current-user', generateId())
  const [proposeDialogOpen, setProposeDialogOpen] = useState(false)

  const safeMembers = members || []
  const safeHistory = history || []
  const safeCurrentPeriod = currentPeriod || null

  const nextOrganizer = getNextOrganizer(safeMembers)
  const averagePoints = safeMembers.length > 0
    ? Math.round(safeMembers.reduce((sum, m) => sum + m.points, 0) / safeMembers.length)
    : 0

  const handleAddMember = (name: string) => {
    const newMember: TeamMember = {
      id: generateId(),
      name,
      points: averagePoints,
      reputationScore: 0,
      totalVenuesProposed: 0,
      joinedAt: Date.now(),
    }
    setMembers((current) => [...(current || []), newMember])
    toast.success(`${name} added to the roster`)
  }

  const handleRemoveMember = (id: string) => {
    const member = safeMembers.find(m => m.id === id)
    if (!member) return

    if (safeCurrentPeriod?.organizerId === id) {
      toast.error('Cannot remove the current organizer during an active period')
      return
    }

    setMembers((current) => (current || []).filter(m => m.id !== id))
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
    if (!nextOrganizer) return

    const period: LunchPeriod = {
      id: generateId(),
      organizerId: nextOrganizer.id,
      startDate: Date.now(),
      endDate: null,
      venueOptions: venues,
      winningVenueId: null,
      status: 'voting',
      votingDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }

    setCurrentPeriod(period)
    setMembers((current) =>
      (current || []).map(m =>
        m.id === nextOrganizer.id
          ? { ...m, totalVenuesProposed: m.totalVenuesProposed + 1 }
          : m
      )
    )
    toast.success('Voting has started!')
  }

  const handleVote = (venueId: string) => {
    if (!safeCurrentPeriod || !currentUserId) return

    const alreadyVoted = safeCurrentPeriod.venueOptions.some(v => v.votes.includes(currentUserId))
    if (alreadyVoted) {
      toast.error('You have already voted')
      return
    }

    const updatedPeriod: LunchPeriod = {
      ...safeCurrentPeriod,
      venueOptions: safeCurrentPeriod.venueOptions.map(v =>
        v.id === venueId ? { ...v, votes: [...v.votes, currentUserId] } : v
      ),
    }

    setCurrentPeriod(updatedPeriod)
    toast.success('Vote recorded!')
  }

  const handleCompletePeriod = () => {
    if (!safeCurrentPeriod) return

    const sortedVenues = [...safeCurrentPeriod.venueOptions].sort(
      (a, b) => b.votes.length - a.votes.length
    )
    const winner = sortedVenues[0]

    const completedPeriod: LunchPeriod = {
      ...safeCurrentPeriod,
      winningVenueId: winner.id,
      status: 'completed',
      endDate: Date.now(),
    }

    const totalVotes = safeCurrentPeriod.venueOptions.reduce((sum, v) => sum + v.votes.length, 0)

    setHistory((current) => [completedPeriod, ...(current || [])])
    setCurrentPeriod(null)
    
    setMembers((current) =>
      (current || []).map(m => {
        if (m.id === safeCurrentPeriod.organizerId) {
          const newReputation = calculateReputationScore(
            totalVotes,
            m.totalVenuesProposed
          )
          return {
            ...m,
            points: m.points + 1,
            reputationScore: newReputation,
          }
        }
        return m
      })
    )

    toast.success(`${winner.name} won with ${winner.votes.length} votes!`)
  }

  const handleDeferTurn = () => {
    if (!nextOrganizer) return
    toast.success(`${nextOrganizer.name}'s turn deferred`)
  }

  const handleToggleHoliday = (checked: boolean) => {
    setIsHolidayMode(checked)
    toast.success(checked ? 'Holiday mode enabled' : 'Holiday mode disabled')
  }

  const userHasVoted = safeCurrentPeriod?.venueOptions.some(v => currentUserId && v.votes.includes(currentUserId)) || false
  const totalVotes = safeCurrentPeriod?.venueOptions.reduce((sum, v) => sum + v.votes.length, 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
            Team Lunch Roster
          </h1>
          <p className="text-muted-foreground">
            Fair rotation, great food, happy team
          </p>
        </header>

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
          {nextOrganizer && !isHolidayMode && !safeCurrentPeriod && (
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

            {safeMembers.length === 0 ? (
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
                  {safeMembers
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

                <Leaderboard members={safeMembers} />
              </>
            )}
          </TabsContent>

          <TabsContent value="vote" className="space-y-6">
            {!safeCurrentPeriod ? (
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
                      Organized by {safeMembers.find(m => m.id === safeCurrentPeriod.organizerId)?.name}
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
                  {safeCurrentPeriod.venueOptions.map((venue) => (
                    <VenueVotingCard
                      key={venue.id}
                      venue={venue}
                      hasVoted={userHasVoted}
                      userVotedForThis={currentUserId ? venue.votes.includes(currentUserId) : false}
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
            <HistoryList history={safeHistory} members={safeMembers} />
          </TabsContent>
        </Tabs>
      </div>

      <ProposeVenueDialog
        open={proposeDialogOpen}
        onClose={() => setProposeDialogOpen(false)}
        onSubmit={handleProposeVenues}
        organizerName={nextOrganizer?.name || ''}
      />
    </div>
  )
}

export default App