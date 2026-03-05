import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Note: Using a simple calendar implementation since @radix-ui/react-calendar doesn't exist
// This is a custom calendar component

export interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected || new Date()
  )

  const startOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  )
  const endOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  )
  const startDate = new Date(startOfMonth)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const days: Date[] = []
  const current = new Date(startDate)
  while (current <= endOfMonth || days.length < 42) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  const isSameMonth = (date: Date) => {
    return (
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    )
  }

  const isSelected = (date: Date) => {
    if (!selected) return false
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    )
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    )
  }

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    )
  }

  return (
    <div className={cn("rounded-md border bg-card p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => (
          <button
            key={idx}
            onClick={() => onSelect?.(date)}
            className={cn(
              "h-9 w-9 rounded-md text-sm transition-colors",
              !isSameMonth(date) && "text-muted-foreground opacity-50",
              isSelected(date) &&
                "bg-primary text-primary-foreground hover:bg-primary/90",
              !isSelected(date) &&
                isToday(date) &&
                "bg-accent text-accent-foreground",
              !isSelected(date) &&
                !isToday(date) &&
                "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {date.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}
