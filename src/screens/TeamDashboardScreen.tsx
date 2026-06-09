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
import { ClockIcon, MapPinIcon, UserCircleIcon, UsersIcon } from '@phosphor-icons/react'

interface TeamDashboardScreenProps {
  readonly team: Team
  readonly teams: Team[]
  readonly members: TeamMember[]
  readonly currentUserMemberId?: string
  readonly nextOrganizer: TeamMember | null
  readonly isHolidayMode: boolean
  readonly onBack: () => void
  readonly onTeamSwitch: (teamId: string) => void
  readonly onAddMember: (email: string) => void
  readonly onRemoveMember: (id: string) => void
  readonly onToggleHoliday: (checked: boolean) => void
  readonly onToggleMemberAway: (memberId: string, isAway: boolean) => void
  readonly onNavigateToVote: () => void
  readonly onNavigateToHistory: () => void
  readonly onNavigateToProfile?: (memberId: string) => void
}

export function TeamDashboardScreen({
  team,
  teams,
  members,
  currentUserMemberId,
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
  onNavigateToProfile,
}: TeamDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<'roster' | 'vote' | 'history'>('roster')
  const averagePoints =
    members.length > 0 ? Math.round(members.reduce((sum, m) => sum + m.points, 0) / members.length) : 0
  const sortedMembers = [...members].sort((a, b) => a.points - b.points)
  const handleTabChange = (value: string) => {
    if (value === 'roster' || value === 'vote' || value === 'history') {
      setActiveTab(value)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ScreenHeader
          title={`${team.emoji} ${team.name}`}
          subtitle={`${members.length} ${members.length === 1 ? 'member' : 'members'}`}
          onBack={onBack}
          actions={
            <div className="flex items-center gap-2">
              {currentUserMemberId && onNavigateToProfile && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => onNavigateToProfile(currentUserMemberId)}
                >
                  <UserCircleIcon size={16} />
                  My Profile
                </Button>
              )}
              <TeamSwitcher teams={teams} currentTeamId={team.id} onTeamChange={onTeamSwitch} />
            </div>
          }
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
                Next in the Saga: <span className="font-medium text-foreground">{nextOrganizer.name}</span>
              </span>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="roster" className="gap-2">
              <UsersIcon size={16} />
              Roster
            </TabsTrigger>
            <TabsTrigger value="vote" className="gap-2">
              <MapPinIcon size={16} />
              Vote
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <ClockIcon size={16} />
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
                icon={<UsersIcon size={48} />}
                title="Your Fellowship Awaits"
                description="Assemble your team to begin the saga of legendary lunch adventures"
              />
            ) : (
              <>
                <div className="grid gap-3">
                  {sortedMembers.map((member) => (
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
