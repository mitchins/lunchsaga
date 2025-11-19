import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Plus, X } from '@phosphor-icons/react'
import { VenueOption } from '@/lib/types'
import { generateId } from '@/lib/helpers'

interface ProposeVenueDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (venues: VenueOption[]) => void
  organizerName: string
  organizerId: string
}

export function ProposeVenueDialog({ open, onClose, onSubmit, organizerName, organizerId }: ProposeVenueDialogProps) {
  const [venues, setVenues] = useState<Array<{ name: string; description: string }>>([
    { name: '', description: '' },
    { name: '', description: '' },
  ])

  const handleAddVenue = () => {
    if (venues.length < 5) {
      setVenues([...venues, { name: '', description: '' }])
    }
  }

  const handleRemoveVenue = (index: number) => {
    if (venues.length > 1) {
      setVenues(venues.filter((_, i) => i !== index))
    }
  }

  const handleVenueChange = (index: number, field: 'name' | 'description', value: string) => {
    const updated = [...venues]
    updated[index][field] = value
    setVenues(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validVenues = venues.filter(v => v.name.trim())
    if (validVenues.length > 0) {
      const venueOptions: VenueOption[] = validVenues.map(v => ({
        id: generateId(),
        name: v.name.trim(),
        description: v.description.trim(),
        votes: [],
        proposedBy: organizerId,
      }))
      onSubmit(venueOptions)
      setVenues([{ name: '', description: '' }, { name: '', description: '' }])
      onClose()
    }
  }

  const isValid = venues.some(v => v.name.trim())

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Propose Lunch Venues</DialogTitle>
            <DialogDescription>
              {organizerName}, it's your turn! Suggest 2-5 venue options for the team to vote on.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {venues.map((venue, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 bg-card">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <MapPin size={16} />
                    Venue {index + 1}
                  </Label>
                  {venues.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveVenue(index)}
                      className="h-6 w-6"
                    >
                      <X size={14} />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Venue name"
                  value={venue.name}
                  onChange={(e) => handleVenueChange(index, 'name', e.target.value)}
                />
                <Textarea
                  placeholder="Brief description (optional)"
                  value={venue.description}
                  onChange={(e) => handleVenueChange(index, 'description', e.target.value)}
                  rows={2}
                />
              </div>
            ))}
            
            {venues.length < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddVenue}
                className="w-full gap-2"
              >
                <Plus size={16} />
                Add Another Venue
              </Button>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Start Voting
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
