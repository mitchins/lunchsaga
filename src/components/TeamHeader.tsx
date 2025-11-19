import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Team, User } from '@/lib/types'
import { ArrowLeft, ShareNetwork, Copy, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface TeamHeaderProps {
  team: Team
  user: User
  memberCount: number
  onBack: () => void
}

export function TeamHeader({ team, user, memberCount, onBack }: TeamHeaderProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(team.inviteCode)
    setCopied(true)
    toast.success('Invite code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="mb-6 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          
          <div 
            className="text-3xl w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${team.color}15` }}
          >
            {team.emoji}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold">{team.name}</h2>
              {team.ownerId === user.id && (
                <Badge variant="secondary">Owner</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </p>
          </div>

          <Button variant="outline" size="sm" className="gap-2" onClick={() => setInviteDialogOpen(true)}>
            <ShareNetwork size={16} />
            Invite
          </Button>
        </div>
      </div>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to {team.name}</DialogTitle>
            <DialogDescription>
              Share this code with your teammates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground mb-1">Invite Code</p>
                <p className="text-3xl font-bold tracking-wider" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {team.inviteCode}
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={handleCopyInviteCode}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Anyone with this code can join your team
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
