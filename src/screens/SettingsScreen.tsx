import { Team } from '@/lib/types'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useEffect, useState } from 'react'

interface SettingsScreenProps {
  team: Team
  isHolidayMode: boolean
  onBack: () => void
  onToggleHoliday: (checked: boolean) => void
  onUpdateTeam?: (updates: Partial<Team>) => Promise<void>
}

export function SettingsScreen({
  team,
  isHolidayMode,
  onBack,
  onToggleHoliday,
  onUpdateTeam,
}: SettingsScreenProps) {
  const [teamName, setTeamName] = useState(team.name)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setTeamName(team.name)
  }, [team.name])

  const canSaveTeamName = teamName.trim() && teamName.trim() !== team.name
  const handleSaveTeamName = async () => {
    if (!canSaveTeamName || !onUpdateTeam) return
    const nextTeamName = teamName.trim()

    setIsSaving(true)
    try {
      await onUpdateTeam({ name: nextTeamName })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ScreenHeader title="Team Settings" subtitle="Manage your team configuration" onBack={onBack} />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
              <CardDescription>Update your team's basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Engineering Team"
                />
              </div>

              <Button
                type="button"
                onClick={handleSaveTeamName}
                disabled={!canSaveTeamName || isSaving}
              >
                Save Team Name
              </Button>

              <div className="flex items-center gap-3">
                <div className="text-4xl">{team.emoji}</div>
                <div>
                  <div className="font-medium">Team Emoji</div>
                  <div className="text-sm text-muted-foreground">Click to change</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg"
                  style={{ backgroundColor: team.color }}
                ></div>
                <div>
                  <div className="font-medium">Team Color</div>
                  <div className="text-sm text-muted-foreground">Click to change</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Invite Code</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={team.inviteCode}
                    readOnly
                    className="font-mono text-lg tracking-wider"
                  />
                  <Button variant="outline">Copy</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Holiday Mode</CardTitle>
              <CardDescription>
                Pause lunch rotations during team breaks or holidays
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Enable Holiday Mode</div>
                  <div className="text-sm text-muted-foreground">
                    This will pause all lunch rotations and voting
                  </div>
                </div>
                <Switch
                  checked={isHolidayMode}
                  onCheckedChange={onToggleHoliday}
                  data-testid="settings-holiday-toggle"
                  aria-label="Enable Holiday Mode"
                />
              </div>

              {isHolidayMode && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm">
                    🏖️ Holiday mode is active. Your team streak is protected during this time.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for this team</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" disabled>
                Delete Team
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                This action cannot be undone. All team data will be permanently deleted.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
