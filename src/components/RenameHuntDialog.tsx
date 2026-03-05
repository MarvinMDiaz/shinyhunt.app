import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RenameHuntDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  onRename: (name: string) => void
}

export function RenameHuntDialog({
  open,
  onOpenChange,
  currentName,
  onRename,
}: RenameHuntDialogProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) {
      setName(currentName)
    }
  }, [open, currentName])

  const handleRename = () => {
    if (name.trim() && name.trim() !== currentName) {
      onRename(name.trim())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Hunt</DialogTitle>
          <DialogDescription>
            Enter a new name for this hunt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Hunt Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename()
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={!name.trim() || name.trim() === currentName}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
