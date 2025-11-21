import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarBlank } from '@phosphor-icons/react'

interface WeeklyPickerCardProps {
  organizerName: string
  weekNumber: number
  isActive: boolean
  onStart?: () => void
}

export function WeeklyPickerCard({ organizerName, weekNumber, isActive }: WeeklyPickerCardProps) {
  return (
    <Card className={isActive ? 'border-primary' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarBlank size={20} />
          Week {weekNumber}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Organizer</span>
            <span className="font-medium">{organizerName}</span>
          </div>
          {isActive && (
            <Badge variant="default" className="mt-2">
              Active
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
