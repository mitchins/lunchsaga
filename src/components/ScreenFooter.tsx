import { Separator } from '@/components/ui/separator'

export function ScreenFooter() {
  return (
    <footer className="mt-12 pt-6">
      <Separator className="mb-6" />
      <div className="text-center text-sm text-muted-foreground">
        <p>LunchSaga &copy; {new Date().getFullYear()}</p>
        <p className="mt-1">Tiny rituals for tiny teams</p>
      </div>
    </footer>
  )
}
