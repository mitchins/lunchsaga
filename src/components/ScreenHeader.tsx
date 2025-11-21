import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@phosphor-icons/react'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  actions?: ReactNode
}

export function ScreenHeader({ title, subtitle, onBack, actions }: ScreenHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {onBack && (
            <Button variant="ghost" size="sm" className="gap-2 mb-3 -ml-2" onClick={onBack}>
              <ArrowLeft size={16} />
              Back
            </Button>
          )}
          <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
