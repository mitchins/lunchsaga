import { cn } from '@/lib/utils'

interface TitleTagProps {
  title: string
  className?: string
}

export function TitleTag({ title, className }: TitleTagProps) {
  if (!title) return null

  return (
    <span
      className={cn(
        'text-sm text-muted-foreground italic font-medium',
        className
      )}
    >
      {title}
    </span>
  )
}
