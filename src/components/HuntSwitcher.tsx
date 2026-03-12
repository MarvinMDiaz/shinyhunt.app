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
  showNewHuntButton?: boolean // If true, show "New Hunt" in dropdown; if false, hide it (for desktop with separate button)
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
  showNewHuntButton = true,
}: HuntSwitcherProps) {
  const activeHunts = hunts.filter((h) => !h.archived && !h.completed)
  const currentHunt = hunts.find((h) => h.id === currentHuntId)

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full min-w-[110px] md:min-w-[200px] max-w-full md:max-w-[280px] justify-between h-9 md:h-[46px] text-xs md:text-sm px-2.5 md:px-3.5">
            <span className="truncate font-medium">
              {currentHunt?.name || 'Select...'}
            </span>
            <ChevronDown className="ml-1.5 md:ml-2 h-3 w-3 md:h-4 md:w-4 shrink-0 opacity-50" />
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
          {showNewHuntButton && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onCreateHunt}>
                <Plus className="mr-2 h-4 w-4" />
                New Hunt
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {currentHunt && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-[46px] w-[46px]">
              <MoreVertical className="h-[21px] w-[21px]" />
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
