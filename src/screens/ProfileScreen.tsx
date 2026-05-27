import { useState } from 'react'
import { TeamMember } from '@/lib/types'
import { Badge as BadgeType, UserBadge } from '@/mocks/badges'
import { ScreenHeader } from '@/components/ScreenHeader'
import { BadgeIcon } from '@/components/BadgeIcon'
import { TitleTag } from '@/components/TitleTag'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { getAchievementTitle } from '@/lib/helpers'
import { Separator } from '@/components/ui/separator'
import { AirplaneTiltIcon, CheckIcon, PencilSimpleIcon, XIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ProfileScreenProps {
  readonly member: TeamMember
  readonly badges: BadgeType[]
  readonly userBadges: UserBadge[]
  readonly isOwnProfile?: boolean
  readonly onBack: () => void
  readonly onUpdateName?: (name: string) => Promise<void>
  readonly onToggleAway?: (isAway: boolean) => Promise<void>
}

export function ProfileScreen({ 
  member, 
  badges, 
  userBadges, 
  isOwnProfile = false,
  onBack,
  onUpdateName,
  onToggleAway,
}: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(member.name)
  const [isSaving, setIsSaving] = useState(false)

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

  const handleSaveName = async () => {
    if (!onUpdateName || editName.trim() === member.name) {
      setIsEditing(false)
      return
    }

    const trimmedName = editName.trim()
    if (!trimmedName) {
      toast.error('Name cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      await onUpdateName(trimmedName)
      toast.success('Name updated successfully')
      setIsEditing(false)
    } catch {
      toast.error('Failed to update name')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditName(member.name)
    setIsEditing(false)
  }

  const handleToggleAway = async (checked: boolean) => {
    if (!onToggleAway) return
    
    try {
      await onToggleAway(checked)
      toast.success(checked ? 'Marked as away' : 'Marked as active')
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ScreenHeader title={isOwnProfile ? "My Profile" : "Member Profile"} onBack={onBack} />

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-2xl font-semibold h-12"
                        placeholder="Enter your name"
                        disabled={isSaving}
                        maxLength={200}
                        autoFocus
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={handleSaveName}
                        disabled={isSaving}
                        aria-label="Save name"
                      >
                        <CheckIcon size={20} className="text-green-600" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        aria-label="Cancel editing"
                      >
                        <XIcon size={20} className="text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-3xl font-semibold">{member.name}</h2>
                      {member.isAway && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm text-muted-foreground">
                          <AirplaneTiltIcon size={14} />
                          Away
                        </span>
                      )}
                      {isOwnProfile && onUpdateName && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => setIsEditing(true)}
                          className="ml-1"
                          aria-label="Edit name"
                        >
                          <PencilSimpleIcon size={18} />
                        </Button>
                      )}
                    </>
                  )}
                </div>
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

        {isOwnProfile && onToggleAway && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="away-status" className="text-base font-medium">
                    Away Status
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When away, you'll be skipped in the rotation and won't be notified
                  </p>
                </div>
                <Switch
                  id="away-status"
                  checked={member.isAway ?? false}
                  onCheckedChange={handleToggleAway}
                />
              </div>
            </CardContent>
          </Card>
        )}

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
