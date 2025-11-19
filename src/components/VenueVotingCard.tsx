import { VenueOption } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, ThumbsUp } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface VenueVotingCardProps {
  venue: VenueOption
  hasVoted: boolean
  userVotedForThis: boolean
  onVote: (venueId: string) => void
  showResults?: boolean
}

export function VenueVotingCard({
  venue,
  hasVoted,
  userVotedForThis,
  onVote,
  showResults = false,
}: VenueVotingCardProps) {
  const voteCount = venue.votes.length

  return (
    <Card className={cn(
      "p-4 transition-all",
      userVotedForThis && "ring-2 ring-primary shadow-md"
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <MapPin size={20} weight="fill" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-base mb-1">{venue.name}</h4>
          {venue.description && (
            <p className="text-sm text-muted-foreground mb-3">{venue.description}</p>
          )}
          
          <div className="flex items-center gap-3">
            {!hasVoted ? (
              <Button
                size="sm"
                onClick={() => onVote(venue.id)}
                className="gap-2"
              >
                <ThumbsUp size={16} />
                Vote
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                {userVotedForThis && (
                  <Badge variant="default" className="gap-1">
                    <ThumbsUp size={12} weight="fill" />
                    Your Vote
                  </Badge>
                )}
                {showResults && (
                  <Badge variant="secondary">
                    {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
