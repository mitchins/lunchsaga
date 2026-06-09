import { TeamMember } from '@/lib/types'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, TrendUp } from '@phosphor-icons/react'

interface LeaderboardScreenProps {
  members: TeamMember[]
  onBack: () => void
  onSelectMember?: (memberId: string) => void
}

export function LeaderboardScreen({ members, onBack, onSelectMember }: LeaderboardScreenProps) {
  const sortedByReputation = [...members].sort((a, b) => b.reputationScore - a.reputationScore)
  const isSelectable = Boolean(onSelectMember)

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy size={24} weight="fill" className="text-yellow-500" />
    if (index === 1) return <Medal size={24} weight="fill" className="text-gray-400" />
    if (index === 2) return <Medal size={24} weight="fill" className="text-amber-600" />
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ScreenHeader
          title="Leaderboard"
          subtitle="Team members ranked by reputation and performance"
          onBack={onBack}
        />

        <div className="space-y-3">
          {sortedByReputation.map((member, index) => {
            const medal = getMedalIcon(index)
            const winRate =
              member.totalVenuesProposed > 0
                ? Math.round((member.totalWins / member.totalVenuesProposed) * 100)
                : 0
            const cardClassName = isSelectable
              ? "cursor-pointer hover:shadow-lg transition-all"
              : "transition-all"

            const cardProps = isSelectable
              ? {
                  role: "button",
                  tabIndex: 0,
                  onClick: () => onSelectMember?.(member.id),
                  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      onSelectMember?.(member.id)
                    }
                  },
                  "aria-label": `View profile for ${member.name}`,
                }
              : {}

            return (
              <Card
                key={member.id}
                className={cardClassName}
                {...cardProps}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex items-center gap-3 flex-1">
                    {medal ? (
                      medal
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center text-muted-foreground font-medium">
                        {index + 1}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {member.reputationScore.toFixed(1)} reputation
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-semibold">{member.points}</div>
                      <div className="text-xs text-muted-foreground">Picks</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{member.totalWins}</div>
                      <div className="text-xs text-muted-foreground">Wins</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{winRate}%</div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                    </div>
                  </div>

                  {index < 3 && (
                    <Badge variant="secondary" className="ml-2">
                      Top {index + 1}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {members.length === 0 && (
          <Card className="p-12 text-center">
            <TrendUp size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No members yet</h3>
            <p className="text-sm text-muted-foreground">
              Add team members to see the leaderboard
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
