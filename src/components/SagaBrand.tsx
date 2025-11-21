interface SagaBrandProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SagaBrand({ size = 'lg', className = '' }: SagaBrandProps) {
  const sizes = {
    sm: {
      emblem: 'w-8 h-8 text-2xl',
      title: 'text-xl',
      tagline: 'text-xs',
    },
    md: {
      emblem: 'w-12 h-12 text-4xl',
      title: 'text-3xl',
      tagline: 'text-sm',
    },
    lg: {
      emblem: 'w-16 h-16 text-6xl',
      title: 'text-4xl',
      tagline: 'text-base',
    },
  }

  return (
    <div className={`text-center space-y-3 ${className}`}>
      {/* Subtle heraldic emblem - a simple shield with dining utensils */}
      <div className="flex items-center justify-center">
        <div 
          className={`${sizes[size].emblem} rounded-lg flex items-center justify-center relative`}
          style={{ 
            background: 'linear-gradient(135deg, var(--saga-gold-muted) 0%, transparent 100%)',
            border: '1px solid var(--saga-gold)',
          }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            className="w-3/5 h-3/5"
            style={{ color: 'var(--saga-navy)' }}
          >
            {/* Simple shield shape with fork and knife */}
            <path 
              d="M12 2L4 6v5c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V6l-8-4z" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill="none"
            />
            {/* Fork on left */}
            <path 
              d="M9 8v8M7.5 8v3M10.5 8v3" 
              stroke="currentColor" 
              strokeWidth="1" 
              strokeLinecap="round"
            />
            {/* Knife on right */}
            <path 
              d="M15 8v8M15 8l1.5 2" 
              stroke="currentColor" 
              strokeWidth="1" 
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      
      <div>
        <h1 
          className={`${sizes[size].title} font-semibold tracking-tight`}
          style={{ 
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, var(--saga-navy) 0%, var(--saga-slate) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          LunchSaga
        </h1>
        <p className={`${sizes[size].tagline} text-muted-foreground italic`}>
          Where every lunch tells a story
        </p>
      </div>
    </div>
  )
}
