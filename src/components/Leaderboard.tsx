import { TeamMember } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface LeaderboardProps {
  members: TeamMember[]
}

export function Leaderboard({ members }: LeaderboardProps) {
  const sorted = [...members]
    .filter(m => m.reputationScore > 0)
    .sort((a, b) => b.reputationScore - a.reputationScore)
    .slice(0, 5)

  if (sorted.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          No reputation scores yet. Complete some lunch periods to see the leaderboard!
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Trophy size={20} weight="fill" className="text-amber-500" />
        Top Organizers
      </h3>
      <div className="space-y-3">
        {sorted.map((member, index) => {
          const initials = member.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

          return (
            <div
              key={member.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                index === 0 && "bg-amber-50 border border-amber-200",
                index > 0 && "bg-muted/50"
              )}
            >
              <div className="font-bold text-lg text-muted-foreground w-6">
                {index + 1}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarFallback className={cn(
                  index === 0 && "bg-amber-500 text-white"
                )}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-muted-foreground">
                  {member.totalVenuesProposed} {member.totalVenuesProposed === 1 ? 'venue' : 'venues'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg flex items-center gap-1">
                  <Trophy size={16} weight="fill" className="text-amber-500" />
                  {member.reputationScore}
                </div>
                <div className="text-xs text-muted-foreground">avg votes</div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
