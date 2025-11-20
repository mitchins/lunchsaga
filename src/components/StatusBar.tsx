import { Team, TeamMember } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CaretDown, CalendarBlank } from '@phosphor-icons/react'

interface StatusBarProps {
  currentTeam: Team
  allTeams: Team[]
  nextOrganizer: TeamMember | null
  currentWeek: number
  onTeamSwitch: (teamId: string) => void
}

export function StatusBar({
  currentTeam,
  allTeams,
  nextOrganizer,
  currentWeek,
  onTeamSwitch,
}: StatusBarProps) {
  return (
    <div className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b px-4 py-3 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 font-medium">
                <span
                  className="text-2xl w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${currentTeam.color}15` }}
                >
                  {currentTeam.emoji}
                </span>
                <span className="truncate">{currentTeam.name}</span>
                <CaretDown size={16} className="text-muted-foreground flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Switch Team</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allTeams.map((team) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => onTeamSwitch(team.id)}
                  className="gap-2"
                >
                  <span
                    className="text-xl w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${team.color}15` }}
                  >
                    {team.emoji}
                  </span>
                  <span className="truncate">{team.name}</span>
                  {team.id === currentTeam.id && (
                    <span className="ml-auto text-primary">●</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarBlank size={16} />
            <span>Week {currentWeek}</span>
          </div>
          {nextOrganizer && (
            <div className="flex items-center gap-1.5">
              <span className="text-foreground font-medium">Up Next:</span>
              <span className="text-accent-foreground bg-accent/20 px-2 py-0.5 rounded">
                {nextOrganizer.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
