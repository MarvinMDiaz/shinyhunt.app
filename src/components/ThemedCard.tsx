import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { ThemeId, getTheme } from "@/lib/themes"

interface ThemedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  themeId?: ThemeId
}

export const ThemedCard = React.forwardRef<HTMLDivElement, ThemedCardProps>(
  ({ className, themeId = 'default', style, ...props }, ref) => {
    const theme = getTheme(themeId)
    
    return (
      <Card
        ref={ref}
        className={cn(
          "transition-all duration-300 hover:border-opacity-60",
          className
        )}
        style={{
          borderColor: `${theme.primaryColor}40`,
          boxShadow: `0 1px 3px 0 ${theme.primaryColor}20, 0 0 0 1px ${theme.primaryColor}30`,
          ...style,
        }}
        {...props}
      />
    )
  }
)
ThemedCard.displayName = "ThemedCard"
