import { useState } from 'react'
import { TeamMember } from '@/lib/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Trophy, X, Crown, CaretDown, CaretUp, AirplaneTilt } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { getAchievementTitle } from '@/lib/helpers'
import { motion, AnimatePresence } from 'framer-motion'

interface MemberCardProps {
  member: TeamMember
  isNextOrganizer: boolean
  onRemove: (id: string) => void
  onToggleAway?: (id: string, isAway: boolean) => void
  showRemove?: boolean
}

export function MemberCard({ member, isNextOrganizer, onRemove, onToggleAway, showRemove = true }: MemberCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAway, setIsAway] = useState(false)

  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const achievementTitle = getAchievementTitle(member)

  const handleToggleAway = (checked: boolean) => {
    setIsAway(checked)
    onToggleAway?.(member.id, checked)
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isNextOrganizer && !isAway && "ring-2 ring-saga-gold shadow-lg shadow-saga-gold/20",
      isAway && "opacity-60"
    )}>
      <div 
        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-saga-gold-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarFallback className={cn(
            "text-base font-medium",
            isNextOrganizer && !isAway && "bg-gradient-to-br from-saga-gold to-saga-gold/80 text-saga-navy"
          )}>
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-lg truncate">{member.name}</h3>
            {isNextOrganizer && !isAway && (
              <Badge 
                variant="default" 
                className="bg-saga-gold text-saga-navy animate-pulse border-saga-gold"
              >
                Herald of the Feast
              </Badge>
            )}
            {isAway && (
              <Badge variant="secondary" className="gap-1">
                <AirplaneTilt size={12} />
                Away
              </Badge>
            )}
          </div>
          {achievementTitle && (
            <p className="text-xs text-muted-foreground italic mt-0.5">{achievementTitle}</p>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span>{member.points} quests</span>
            {member.totalWins > 0 && (
              <span className="flex items-center gap-1">
                <Crown size={14} weight="fill" style={{ color: 'var(--saga-gold)' }} />
                {member.totalWins} {member.totalWins === 1 ? 'victory' : 'victories'}
              </span>
            )}
            {member.reputationScore > 0 && (
              <span className="flex items-center gap-1">
                <Trophy size={14} weight="fill" className="text-primary" />
                {member.reputationScore}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="secondary" className="font-medium">
            {member.points}
          </Badge>
          {isExpanded ? <CaretUp size={16} className="text-muted-foreground" /> : <CaretDown size={16} className="text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Separator />
            <div className="p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`away-${member.id}`} className="text-sm font-medium">
                    Mark as Away
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Skip in rotation while on vacation or busy
                  </p>
                </div>
                <Switch
                  id={`away-${member.id}`}
                  checked={isAway}
                  onCheckedChange={handleToggleAway}
                />
              </div>

              {showRemove && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(member.id)
                  }}
                  className="w-full gap-2"
                >
                  <X size={16} />
                  Remove from Team
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
