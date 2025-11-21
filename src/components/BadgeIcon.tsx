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
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    legendary: 'from-yellow-400 to-yellow-600',
  }

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center transition-all',
        sizeClasses[size],
        earned
          ? `bg-gradient-to-br ${rarityColors[badge.rarity]} shadow-lg`
          : 'bg-muted opacity-30 grayscale',
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
