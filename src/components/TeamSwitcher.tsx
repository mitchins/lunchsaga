import { Team } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TeamSwitcherProps {
  teams: Team[]
  currentTeamId: string
  onTeamChange: (teamId: string) => void
}

export function TeamSwitcher({ teams, currentTeamId, onTeamChange }: TeamSwitcherProps) {
  const currentTeam = teams.find((t) => t.id === currentTeamId)

  if (teams.length <= 1) return null

  return (
    <Select value={currentTeamId} onValueChange={onTeamChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue>
          {currentTeam && (
            <span className="flex items-center gap-2">
              <span>{currentTeam.emoji}</span>
              <span>{currentTeam.name}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            <span className="flex items-center gap-2">
              <span>{team.emoji}</span>
              <span>{team.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
