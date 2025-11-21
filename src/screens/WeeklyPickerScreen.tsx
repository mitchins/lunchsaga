import { TeamMember } from '@/lib/types'
import { ScreenHeader } from '@/components/ScreenHeader'
import { WeeklyPickerCard } from '@/components/WeeklyPickerCard'
import { Button } from '@/components/ui/button'

interface WeeklyPickerScreenProps {
  members: TeamMember[]
  nextOrganizer: TeamMember | null
  currentWeek: number
  onBack: () => void
  onStartWeek: () => void
}

export function WeeklyPickerScreen({
  members,
  nextOrganizer,
  currentWeek,
  onBack,
  onStartWeek,
}: WeeklyPickerScreenProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ScreenHeader
          title="Weekly Picker"
          subtitle="View upcoming organizers and start new weeks"
          onBack={onBack}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {nextOrganizer && (
            <WeeklyPickerCard
              organizerName={nextOrganizer.name}
              weekNumber={currentWeek}
              isActive={true}
            />
          )}
          {members
            .filter((m) => m.id !== nextOrganizer?.id)
            .slice(0, 5)
            .map((member, index) => (
              <WeeklyPickerCard
                key={member.id}
                organizerName={member.name}
                weekNumber={currentWeek + index + 1}
                isActive={false}
              />
            ))}
        </div>

        {nextOrganizer && (
          <div className="text-center">
            <Button onClick={onStartWeek} size="lg">
              Start Week {currentWeek} with {nextOrganizer.name}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
