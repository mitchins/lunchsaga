import { TeamMember } from '@/lib/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trophy, X, Crown } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { getAchievementTitle } from '@/lib/helpers'

interface MemberCardProps {
  member: TeamMember
  isNextOrganizer: boolean
  onRemove: (id: string) => void
  showRemove?: boolean
}

export function MemberCard({ member, isNextOrganizer, onRemove, showRemove = true }: MemberCardProps) {
  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const achievementTitle = getAchievementTitle(member)

  return (
    <Card className={cn(
      "p-4 flex items-center gap-3 transition-all",
      isNextOrganizer && "ring-2 ring-accent shadow-lg"
    )}>
      <Avatar className="h-12 w-12">
        <AvatarFallback className={cn(
          "text-base font-medium",
          isNextOrganizer && "bg-accent text-accent-foreground"
        )}>
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium text-lg truncate">{member.name}</h3>
          {isNextOrganizer && (
            <Badge variant="default" className="bg-accent text-accent-foreground animate-pulse">
              Up Next
            </Badge>
          )}
        </div>
        {achievementTitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{achievementTitle}</p>
        )}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span>{member.points} turns</span>
          {member.totalWins > 0 && (
            <span className="flex items-center gap-1">
              <Crown size={14} weight="fill" className="text-amber-500" />
              {member.totalWins} {member.totalWins === 1 ? 'win' : 'wins'}
            </span>
          )}
          {member.reputationScore > 0 && (
            <span className="flex items-center gap-1">
              <Trophy size={14} weight="fill" className="text-primary" />
              {member.reputationScore}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-medium">
          {member.points}
        </Badge>
        {showRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(member.id)}
            className="h-8 w-8"
          >
            <X size={16} />
          </Button>
        )}
      </div>
    </Card>
  )
}
