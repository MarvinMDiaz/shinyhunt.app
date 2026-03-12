import { useState, useEffect, useRef } from 'react'

interface HotkeyInputProps {
  value: string
  onChange: (key: string) => void
  onListeningStart?: () => void
  onListeningEnd?: () => void
  label: string
  className?: string
}

export function HotkeyInput({ 
  value, 
  onChange, 
  onListeningStart,
  onListeningEnd,
  label, 
  className = '' 
}: HotkeyInputProps) {
  const [isListening, setIsListening] = useState(false)
  const inputRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  
  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!isListening) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      // Handle Escape to cancel
      if (e.key === 'Escape') {
        setIsListening(false)
        onListeningEnd?.()
        return
      }

      // Ignore modifier keys alone
      if (['Control', 'Shift', 'Alt', 'Meta', 'Tab'].includes(e.key)) {
        return
      }

      // Get the key name
      let keyName = e.key
      
      // Handle special keys
      if (e.key === ' ') {
        keyName = 'Space'
      } else if (e.key.length === 1) {
        // Single character keys - use uppercase
        keyName = e.key.toUpperCase()
      } else {
        // For function keys and other special keys, use the key as-is
        keyName = e.key
      }
      
      // Update the hotkey - call onChange immediately
      setIsListening(false)
      onListeningEnd?.()
      onChangeRef.current(keyName)
    }

    // Use capture phase to intercept before other handlers
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isListening, onListeningEnd])

  // Close listening mode when clicking outside
  useEffect(() => {
    if (!isListening) return

    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsListening(false)
        onListeningEnd?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isListening])

  const handleClick = () => {
    setIsListening(true)
    onListeningStart?.()
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground min-w-[140px]">{label}:</span>
      <div
        ref={inputRef}
        onClick={handleClick}
        className={`
          px-3 py-1.5 min-w-[60px] text-center
          border-2 rounded-md cursor-pointer
          transition-all
          ${isListening 
            ? 'border-primary bg-primary/10 text-primary' 
            : 'border-border bg-background hover:border-primary/50 hover:bg-accent/50'
          }
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        `}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {isListening ? (
          <span className="text-xs font-medium text-primary">Press a key...</span>
        ) : (
          <span className="text-sm font-mono font-semibold">{value || 'None'}</span>
        )}
      </div>
    </div>
  )
}
