import { TeamMember } from '@/lib/types'
import { Badge as BadgeType, UserBadge } from '@/mocks/badges'
import { ScreenHeader } from '@/components/ScreenHeader'
import { BadgeIcon } from '@/components/BadgeIcon'
import { TitleTag } from '@/components/TitleTag'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getAchievementTitle } from '@/lib/helpers'
import { Separator } from '@/components/ui/separator'

interface ProfileScreenProps {
  member: TeamMember
  badges: BadgeType[]
  userBadges: UserBadge[]
  onBack: () => void
}

export function ProfileScreen({ member, badges, userBadges, onBack }: ProfileScreenProps) {
  const title = getAchievementTitle(member)
  const earnedBadgeIds = userBadges.filter((ub) => ub.userId === member.userId).map((ub) => ub.badgeId)

  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const winRate =
    member.totalVenuesProposed > 0
      ? Math.round((member.totalWins / member.totalVenuesProposed) * 100)
      : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ScreenHeader title="Member Profile" onBack={onBack} />

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-3xl font-semibold mb-2">{member.name}</h2>
                {title && <TitleTag title={title} className="text-base" />}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div>
                    <div className="text-2xl font-semibold">{member.points}</div>
                    <div className="text-sm text-muted-foreground">Total Picks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{member.totalWins}</div>
                    <div className="text-sm text-muted-foreground">Total Wins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{member.reputationScore.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Reputation</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{winRate}%</div>
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badges & Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Earned ({earnedBadgeIds.length})
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {badges
                    .filter((badge) => earnedBadgeIds.includes(badge.id))
                    .map((badge) => (
                      <div key={badge.id} className="flex flex-col items-center gap-2">
                        <BadgeIcon badge={badge} earned={true} size="lg" />
                        <div className="text-center">
                          <div className="text-sm font-medium">{badge.name}</div>
                          <div className="text-xs text-muted-foreground">{badge.rarity}</div>
                        </div>
                      </div>
                    ))}
                </div>
                {earnedBadgeIds.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No badges earned yet
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Locked ({badges.length - earnedBadgeIds.length})
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {badges
                    .filter((badge) => !earnedBadgeIds.includes(badge.id))
                    .map((badge) => (
                      <div key={badge.id} className="flex flex-col items-center gap-2">
                        <BadgeIcon badge={badge} earned={false} size="lg" />
                        <div className="text-center">
                          <div className="text-sm font-medium text-muted-foreground">{badge.name}</div>
                          <div className="text-xs text-muted-foreground">{badge.criteria}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
