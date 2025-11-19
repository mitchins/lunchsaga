import { LunchPeriod, TeamMember } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MapPin, CalendarBlank, ThumbsUp } from '@phosphor-icons/react'

interface HistoryListProps {
  history: LunchPeriod[]
  members: TeamMember[]
}

export function HistoryList({ history, members }: HistoryListProps) {
  if (history.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-5xl mb-4">📜</div>
        <h3 className="font-medium mb-2">No lunch history yet</h3>
        <p className="text-sm text-muted-foreground">
          Complete your first lunch period to start building memories!
        </p>
      </Card>
    )
  }

  const getMemberName = (id: string) => {
    return members.find(m => m.id === id)?.name || 'Unknown'
  }

  return (
    <div className="space-y-4">
      {history.map((period) => {
        const winningVenue = period.venueOptions.find(v => v.id === period.winningVenueId)
        const organizerName = getMemberName(period.organizerId)
        const startDate = new Date(period.startDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })

        return (
          <Card key={period.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <CalendarBlank size={16} />
                  {startDate}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Organized by {organizerName}
                </p>
              </div>
              <Badge variant="outline">Completed</Badge>
            </div>

            {winningVenue && (
              <>
                <Separator className="my-3" />
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-primary mt-1" weight="fill" />
                  <div className="flex-1">
                    <p className="font-medium">{winningVenue.name}</p>
                    {winningVenue.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {winningVenue.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                      <ThumbsUp size={14} />
                      {winningVenue.votes.length} {winningVenue.votes.length === 1 ? 'vote' : 'votes'}
                    </p>
                  </div>
                </div>
              </>
            )}

            {period.venueOptions.length > 1 && (
              <>
                <Separator className="my-3" />
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View all options ({period.venueOptions.length})
                  </summary>
                  <div className="mt-3 space-y-2">
                    {period.venueOptions
                      .filter(v => v.id !== period.winningVenueId)
                      .map(venue => (
                        <div key={venue.id} className="flex items-center justify-between text-sm">
                          <span>{venue.name}</span>
                          <span className="text-muted-foreground">
                            {venue.votes.length} {venue.votes.length === 1 ? 'vote' : 'votes'}
                          </span>
                        </div>
                      ))}
                  </div>
                </details>
              </>
            )}
          </Card>
        )
      })}
    </div>
  )
}
