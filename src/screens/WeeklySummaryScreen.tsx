import { LunchPeriod, TeamMember } from '@/lib/types'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/EmptyState'
import { Clock, Trophy } from '@phosphor-icons/react'
import { format } from 'date-fns'

interface WeeklySummaryScreenProps {
  history: LunchPeriod[]
  members: TeamMember[]
  onBack: () => void
}

export function WeeklySummaryScreen({ history, members, onBack }: WeeklySummaryScreenProps) {
  const getWeekNumber = (period: LunchPeriod) => {
    const weeksSinceStart = Math.ceil((Date.now() - period.startDate) / (7 * 24 * 60 * 60 * 1000))
    return Math.max(1, weeksSinceStart)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ScreenHeader
          title="The Chronicles"
          subtitle="Review past quests and legendary feasts"
          onBack={onBack}
        />

        {history.length === 0 ? (
          <EmptyState
            icon={<Clock size={48} />}
            title="The Chronicles Are Empty"
            description="Your saga's history will appear here once you complete your first chapter"
          />
        ) : (
          <div className="space-y-4">
            {history.map((period) => {
              const organizer = members.find((m) => m.id === period.organizerId)
              const winner = period.venueOptions.find((v) => v.id === period.winningVenueId)
              const totalVotes = period.venueOptions.reduce((sum, v) => sum + v.votes.length, 0)

              return (
                <Card key={period.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">Week {getWeekNumber(period)}</h3>
                          <Badge variant="outline">Completed</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(period.startDate, 'MMM d, yyyy')} -{' '}
                          {period.endDate ? format(period.endDate, 'MMM d, yyyy') : 'Ongoing'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Organized by</div>
                        <div className="font-medium">{organizer?.name || 'Unknown'}</div>
                      </div>
                    </div>

                    {winner && (
                      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                        <div className="flex items-start gap-3">
                          <Trophy size={24} className="text-primary mt-1" weight="fill" />
                          <div className="flex-1">
                            <div className="font-semibold text-lg mb-1">{winner.name}</div>
                            {winner.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {winner.description}
                              </p>
                            )}
                            <div className="text-sm">
                              <span className="font-medium">{winner.votes.length}</span> votes (
                              {Math.round((winner.votes.length / totalVotes) * 100)}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-2">All Options</div>
                      <div className="space-y-2">
                        {period.venueOptions.map((venue) => (
                          <div
                            key={venue.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className={venue.id === winner?.id ? 'font-medium' : ''}>
                              {venue.name}
                            </span>
                            <span className="text-muted-foreground">
                              {venue.votes.length} {venue.votes.length === 1 ? 'vote' : 'votes'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
