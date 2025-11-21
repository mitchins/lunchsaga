import { useState } from 'react'
import { Team, TeamMember } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScreenHeader } from '@/components/ScreenHeader'
import { TeamSwitcher } from '@/components/TeamSwitcher'
import { MemberCard } from '@/components/MemberCard'
import { AddMemberDialog } from '@/components/AddMemberDialog'
import { Leaderboard } from '@/components/Leaderboard'
import { EmptyState } from '@/components/EmptyState'
import { Users, MapPin, Clock } from '@phosphor-icons/react'

interface TeamDashboardScreenProps {
  team: Team
  teams: Team[]
  members: TeamMember[]
  nextOrganizer: TeamMember | null
  isHolidayMode: boolean
  onBack: () => void
  onTeamSwitch: (teamId: string) => void
  onAddMember: (name: string) => void
  onRemoveMember: (id: string) => void
  onToggleHoliday: (checked: boolean) => void
  onToggleMemberAway: (memberId: string, isAway: boolean) => void
  onNavigateToVote: () => void
  onNavigateToHistory: () => void
}

export function TeamDashboardScreen({
  team,
  teams,
  members,
  nextOrganizer,
  isHolidayMode,
  onBack,
  onTeamSwitch,
  onAddMember,
  onRemoveMember,
  onToggleHoliday,
  onToggleMemberAway,
  onNavigateToVote,
  onNavigateToHistory,
}: TeamDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<'roster' | 'vote' | 'history'>('roster')
  const averagePoints =
    members.length > 0 ? Math.round(members.reduce((sum, m) => sum + m.points, 0) / members.length) : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ScreenHeader
          title={`${team.emoji} ${team.name}`}
          subtitle={`${members.length} ${members.length === 1 ? 'member' : 'members'}`}
          onBack={onBack}
          actions={<TeamSwitcher teams={teams} currentTeamId={team.id} onTeamChange={onTeamSwitch} />}
        />

        <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-3">
            <Switch id="holiday-mode" checked={isHolidayMode} onCheckedChange={onToggleHoliday} />
            <Label htmlFor="holiday-mode" className="cursor-pointer">
              Holiday Break Mode
              {isHolidayMode && (
                <Badge className="ml-2" variant="secondary">
                  Active
                </Badge>
              )}
            </Label>
          </div>
          {nextOrganizer && !isHolidayMode && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Next: <span className="font-medium text-foreground">{nextOrganizer.name}</span>
              </span>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="roster" className="gap-2">
              <Users size={16} />
              Roster
            </TabsTrigger>
            <TabsTrigger value="vote" className="gap-2">
              <MapPin size={16} />
              Vote
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock size={16} />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roster" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
                  Team Members
                </h2>
                <Badge variant="outline" className="text-xs">
                  Sorted by turns taken
                </Badge>
              </div>
              <AddMemberDialog onAdd={onAddMember} averagePoints={averagePoints} />
            </div>

            {members.length === 0 ? (
              <EmptyState
                icon={<Users size={48} />}
                title="No team members yet"
                description="Add your teammates to start the fair rotation for weekly lunch picks"
              />
            ) : (
              <>
                <div className="grid gap-3">
                  {members
                    .sort((a, b) => a.points - b.points)
                    .map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        isNextOrganizer={member.id === nextOrganizer?.id}
                        onRemove={onRemoveMember}
                        onToggleAway={onToggleMemberAway}
                      />
                    ))}
                </div>

                <Leaderboard members={members} />
              </>
            )}
          </TabsContent>

          <TabsContent value="vote">
            <Button onClick={onNavigateToVote}>Go to Voting</Button>
          </TabsContent>

          <TabsContent value="history">
            <Button onClick={onNavigateToHistory}>View History</Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
