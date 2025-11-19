import { TeamMember } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Crown, Medal } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { getAchievementTitle } from '@/lib/helpers'

interface LeaderboardProps {
  members: TeamMember[]
}

export function Leaderboard({ members }: LeaderboardProps) {
  const sorted = [...members]
    .filter(m => m.reputationScore > 0 || m.totalWins > 0)
    .sort((a, b) => {
      if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins
      return b.reputationScore - a.reputationScore
    })
    .slice(0, 5)

  if (sorted.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="font-medium mb-2">No leaderboard yet</h3>
        <p className="text-sm text-muted-foreground">
          Complete some lunch periods to see who picks the best spots!
        </p>
      </Card>
    )
  }

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Crown size={20} weight="fill" className="text-amber-500" />
    if (index === 1) return <Medal size={20} weight="fill" className="text-slate-400" />
    if (index === 2) return <Medal size={20} weight="fill" className="text-amber-700" />
    return null
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
          
          const achievement = getAchievementTitle(member)

          return (
            <div
              key={member.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all",
                index === 0 && "bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200",
                index === 1 && "bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200",
                index === 2 && "bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200",
                index > 2 && "bg-muted/50"
              )}
            >
              <div className="flex items-center justify-center w-8">
                {getMedalIcon(index) || (
                  <span className="font-bold text-lg text-muted-foreground">{index + 1}</span>
                )}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarFallback className={cn(
                  index === 0 && "bg-amber-500 text-white",
                  index === 1 && "bg-slate-400 text-white",
                  index === 2 && "bg-amber-700 text-white"
                )}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{member.name}</div>
                {achievement && (
                  <div className="text-xs text-muted-foreground truncate">{achievement}</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold text-base flex items-center gap-1.5 justify-end">
                  {member.totalWins > 0 && (
                    <span className="flex items-center gap-1">
                      <Crown size={16} weight="fill" className="text-amber-500" />
                      {member.totalWins}
                    </span>
                  )}
                  {member.reputationScore > 0 && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Trophy size={14} weight="fill" className="text-primary" />
                      {member.reputationScore}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {member.totalVenuesProposed} {member.totalVenuesProposed === 1 ? 'venue' : 'venues'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
