import { TeamMember } from '@/lib/types'
import { getAchievementTitle } from '@/lib/helpers'
import { TitleTag } from './TitleTag'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface MemberRowProps {
  member: TeamMember
  isNextOrganizer?: boolean
  onSelect?: () => void
}

export function MemberRow({ member, isNextOrganizer, onSelect }: MemberRowProps) {
  const title = getAchievementTitle(member)
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <Avatar className="w-10 h-10">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{member.name}</span>
          {isNextOrganizer && (
            <Badge variant="default" className="text-xs">
              Up Next
            </Badge>
          )}
        </div>
        {title && <TitleTag title={title} />}
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="text-right">
          <div className="font-medium text-foreground">{member.points}</div>
          <div className="text-xs">picks</div>
        </div>
        <div className="text-right">
          <div className="font-medium text-foreground">{member.totalWins}</div>
          <div className="text-xs">wins</div>
        </div>
      </div>
    </div>
  )
}
