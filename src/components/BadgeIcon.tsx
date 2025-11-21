import { Badge as BadgeType } from '@/mocks/badges'
import { cn } from '@/lib/utils'

interface BadgeIconProps {
  badge: BadgeType
  earned?: boolean
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export function BadgeIcon({ badge, earned = false, size = 'md' }: BadgeIconProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xl',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-4xl',
  }

  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    uncommon: 'from-emerald-400 to-emerald-600',
    rare: 'from-blue-500 to-indigo-600',
    legendary: 'from-amber-400 via-yellow-400 to-amber-500',
  }

  const rarityBorders = {
    common: 'border-gray-400/30',
    uncommon: 'border-emerald-400/30',
    rare: 'border-blue-500/30',
    legendary: 'border-amber-400/50 shadow-amber-400/20 shadow-lg',
  }

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center transition-all border-2',
        sizeClasses[size],
        earned
          ? `bg-gradient-to-br ${rarityColors[badge.rarity]} ${rarityBorders[badge.rarity]}`
          : 'bg-muted opacity-30 grayscale border-muted',
        earned && 'hover:scale-110 cursor-pointer'
      )}
      title={badge.name}
    >
      <span className="filter drop-shadow-sm">{badge.icon}</span>
      {badge.unlockProgress !== undefined && badge.unlockTarget && !earned && (
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full px-1 text-xs font-medium border">
          {badge.unlockProgress}/{badge.unlockTarget}
        </div>
      )}
    </div>
  )
}
