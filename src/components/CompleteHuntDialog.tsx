import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface CompleteHuntDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  huntName: string
  onConfirm: (continueCounting: boolean) => void
}

export function CompleteHuntDialog({
  open,
  onOpenChange,
  huntName,
  onConfirm,
}: CompleteHuntDialogProps) {
  const [continueCounting, setContinueCounting] = useState(false)

  const handleConfirm = () => {
    onConfirm(continueCounting)
    setContinueCounting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Hunt as Completed</DialogTitle>
          <DialogDescription>
            Are you sure you want to mark "{huntName}" as completed? This will record the completion date and current count.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="continue"
              checked={continueCounting}
              onCheckedChange={(checked) => setContinueCounting(checked === true)}
            />
            <Label
              htmlFor="continue"
              className="text-sm font-normal cursor-pointer"
            >
              Continue counting after shiny (allow increments)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Mark as Completed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
