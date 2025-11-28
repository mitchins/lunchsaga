import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Team, User } from '@/lib/types'
import { generateId, TEAM_EMOJIS, TEAM_COLORS } from '@/lib/helpers'
import { Plus, SignIn, Users as UsersIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TeamSelectionProps {
  user: User
  teams: Team[]
  onSelectTeam: (team: Team) => void
  onCreateTeam: (team: Team) => void
  onJoinTeam: (inviteCode: string) => void
}

export function TeamSelectionScreen({ user, teams, onSelectTeam, onCreateTeam, onJoinTeam }: TeamSelectionProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState(TEAM_EMOJIS[0])
  const [selectedColor, setSelectedColor] = useState(TEAM_COLORS[0])
  const [inviteCode, setInviteCode] = useState('')

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamName.trim()) return

    const newTeam: Team = {
      id: generateId(),
      name: teamName.trim(),
      emoji: selectedEmoji,
      color: selectedColor.value,
      ownerId: user.id,
      createdAt: Date.now(),
      inviteCode: '', // API will generate the real invite code
    }

    onCreateTeam(newTeam)
    toast.success(`${selectedEmoji} ${teamName} created!`)
    setCreateDialogOpen(false)
    setTeamName('')
    setSelectedEmoji(TEAM_EMOJIS[0])
    setSelectedColor(TEAM_COLORS[0])
  }

  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return

    onJoinTeam(inviteCode.trim().toUpperCase())
    setJoinDialogOpen(false)
    setInviteCode('')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.header 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
            Welcome, {user.name}! 👋
          </h1>
          <p className="text-muted-foreground">
            {teams.length === 0 
              ? 'Gather your fellowship and begin your culinary saga'
              : 'Select your fellowship or forge a new alliance'}
          </p>
        </motion.header>

        <motion.div 
          className="grid gap-4 mb-6 sm:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="cursor-pointer hover:shadow-lg transition-all border-2 border-dashed hover:border-primary/50" onClick={() => setCreateDialogOpen(true)}>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Plus size={48} className="mb-3 text-primary" />
              <h3 className="font-medium text-lg mb-1">Forge New Fellowship</h3>
              <p className="text-sm text-muted-foreground">
                Establish your guild's lunch saga
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all border-2 border-dashed hover:border-primary/50" onClick={() => setJoinDialogOpen(true)}>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <SignIn size={48} className="mb-3 text-primary" />
              <h3 className="font-medium text-lg mb-1">Join Fellowship</h3>
              <p className="text-sm text-muted-foreground">
                Answer the call with an invite code
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {teams.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ letterSpacing: '-0.01em' }}>
              Your Teams
            </h2>
            <div className="grid gap-3">
              {teams.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                    onClick={() => onSelectTeam(team)}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <motion.div 
                        className="text-4xl w-16 h-16 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${team.color}15` }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {team.emoji}
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {team.ownerId === user.id ? 'Guild Master' : 'Member'}
                        </p>
                      </div>
                      <UsersIcon size={24} className="text-muted-foreground" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateTeam}>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Give your team a name and personality
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Engineering Team, Sales Squad, etc."
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label>Choose an Emoji</Label>
                <div className="grid grid-cols-8 gap-2">
                  {TEAM_EMOJIS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      type="button"
                      className={cn(
                        "text-2xl p-2 rounded-lg hover:bg-accent transition-colors",
                        selectedEmoji === emoji && "bg-accent ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedEmoji(emoji)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Choose a Color</Label>
                <div className="grid grid-cols-4 gap-2">
                  {TEAM_COLORS.map((color) => (
                    <motion.button
                      key={color.name}
                      type="button"
                      className={cn(
                        "h-12 rounded-lg transition-all",
                        selectedColor.name === color.name && "ring-2 ring-offset-2 ring-foreground"
                      )}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedColor(color)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="sr-only">{color.name}</span>
                    </motion.button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{selectedColor.name}</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!teamName.trim()}>
                Create Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <form onSubmit={handleJoinTeam}>
            <DialogHeader>
              <DialogTitle>Join Team</DialogTitle>
              <DialogDescription>
                Enter the invite code shared by your team
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="invite-code">Invite Code</Label>
              <Input
                id="invite-code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="text-center text-lg tracking-wider mt-2"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setJoinDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!inviteCode.trim()}>
                Join Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
