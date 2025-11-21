import { LunchPeriod, TeamMember } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScreenHeader } from '@/components/ScreenHeader'
import { VoteButtons } from '@/components/VoteButtons'
import { EmptyState } from '@/components/EmptyState'
import { CalendarBlank } from '@phosphor-icons/react'
import { Progress } from '@/components/ui/progress'

interface VotingScreenProps {
  period: LunchPeriod | null
  members: TeamMember[]
  currentMemberId: string | null
  isHolidayMode: boolean
  onBack: () => void
  onVote: (venueId: string) => void
  onComplete: () => void
  onStartWeek: () => void
}

export function VotingScreen({
  period,
  members,
  currentMemberId,
  isHolidayMode,
  onBack,
  onVote,
  onComplete,
  onStartWeek,
}: VotingScreenProps) {
  if (!period) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <ScreenHeader title="Voting" subtitle="Cast your vote for this week's lunch" onBack={onBack} />
          <EmptyState
            icon={<CalendarBlank size={48} />}
            title="The Chapter Awaits"
            description={
              isHolidayMode
                ? 'Your saga is paused. Disable holiday mode to continue your culinary journey.'
                : 'A new chapter begins when you start this week\'s quest.'
            }
            action={
              !isHolidayMode
                ? {
                    label: 'Begin This Chapter',
                    onClick: onStartWeek,
                  }
                : undefined
            }
          />
        </div>
      </div>
    )
  }

  const organizer = members.find((m) => m.id === period.organizerId)
  const currentMember = members.find((m) => m.userId === currentMemberId)
  const userHasVoted = currentMember
    ? period.venueOptions.some((v) => v.votes.includes(currentMember.id))
    : false
  const totalVotes = period.venueOptions.reduce((sum, v) => sum + v.votes.length, 0)
  const activeMembers = members.length

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ScreenHeader
          title="Vote for This Week's Venue"
          subtitle={`Organized by ${organizer?.name || 'Unknown'}`}
          onBack={onBack}
        />

        {totalVotes > 0 && (
          <Card className="p-4 bg-primary/5 border-primary/20 mb-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  <span className="font-medium">{totalVotes}</span> of{' '}
                  <span className="font-medium">{activeMembers}</span>{' '}
                  {activeMembers === 1 ? 'vote' : 'votes'} cast
                  {totalVotes === activeMembers && ' - All votes in! ✨'}
                </span>
              </div>
              <Progress value={(totalVotes / activeMembers) * 100} />
            </div>
          </Card>
        )}

        {userHasVoted && totalVotes === activeMembers && (
          <div className="mb-6">
            <Button onClick={onComplete} size="lg" className="w-full">
              Complete Voting
            </Button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {period.venueOptions.map((venue) => {
            const userVotedForThis = currentMember ? venue.votes.includes(currentMember.id) : false
            const votePercentage =
              activeMembers > 0 ? Math.round((venue.votes.length / activeMembers) * 100) : 0

            return (
              <Card key={venue.id}>
                <CardHeader>
                  <CardTitle>{venue.name}</CardTitle>
                  {venue.description && (
                    <p className="text-sm text-muted-foreground">{venue.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {userHasVoted && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Votes</span>
                        <span className="font-medium">
                          {venue.votes.length} ({votePercentage}%)
                        </span>
                      </div>
                      <Progress value={votePercentage} />
                    </div>
                  )}
                  <VoteButtons
                    venueId={venue.id}
                    hasVoted={userHasVoted}
                    userVotedForThis={userVotedForThis}
                    onVote={onVote}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
