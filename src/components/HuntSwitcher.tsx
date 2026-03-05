import { ChevronDown, Plus, Copy, Edit, Archive, Trash2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Hunt } from '@/types'

interface HuntSwitcherProps {
  hunts: Hunt[]
  currentHuntId: string | null
  onSelectHunt: (id: string) => void
  onCreateHunt: () => void
  onDuplicateHunt: (id: string) => void
  onRenameHunt: (id: string) => void
  onArchiveHunt: (id: string) => void
  onDeleteHunt: (id: string) => void
}

export function HuntSwitcher({
  hunts,
  currentHuntId,
  onSelectHunt,
  onCreateHunt,
  onDuplicateHunt,
  onRenameHunt,
  onArchiveHunt,
  onDeleteHunt,
}: HuntSwitcherProps) {
  const activeHunts = hunts.filter((h) => !h.archived && !h.completed)
  const currentHunt = hunts.find((h) => h.id === currentHuntId)

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-between">
            <span className="truncate">
              {currentHunt?.name || 'Select a hunt...'}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px]">
          <DropdownMenuLabel>Active Hunts</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {activeHunts.length === 0 ? (
            <DropdownMenuItem disabled>No hunts yet</DropdownMenuItem>
          ) : (
            activeHunts.map((hunt) => (
              <DropdownMenuItem
                key={hunt.id}
                className="cursor-pointer"
                onClick={() => onSelectHunt(hunt.id)}
              >
                {hunt.name}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCreateHunt}>
            <Plus className="mr-2 h-4 w-4" />
            New Hunt
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {currentHunt && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDuplicateHunt(currentHunt.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRenameHunt(currentHunt.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onArchiveHunt(currentHunt.id)}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteHunt(currentHunt.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
