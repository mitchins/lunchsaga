import { Button } from '@/components/ui/button'
import { Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface VoteButtonsProps {
  venueId: string
  hasVoted: boolean
  userVotedForThis: boolean
  onVote: (venueId: string) => void
  disabled?: boolean
}

export function VoteButtons({
  venueId,
  hasVoted,
  userVotedForThis,
  onVote,
  disabled = false,
}: VoteButtonsProps) {
  if (userVotedForThis) {
    return (
      <Button variant="default" className="w-full gap-2" disabled>
        <Check size={18} weight="bold" />
        Voted
      </Button>
    )
  }

  if (hasVoted) {
    return (
      <Button variant="outline" className="w-full" disabled>
        Vote
      </Button>
    )
  }

  return (
    <Button
      variant="default"
      className={cn('w-full', disabled && 'opacity-50')}
      onClick={() => onVote(venueId)}
      disabled={disabled}
    >
      Vote
    </Button>
  )
}
