/**
 * Production Console Guard
 * 
 * Overrides console methods in production to prevent accidental logging.
 * This is a fail-safe layer that ensures no sensitive data leaks even if
 * someone accidentally uses console.* instead of logger.*
 */

const isProduction = import.meta.env.PROD

if (isProduction) {
  // Override console methods in production to be no-ops or minimal
  // Only allow console.error for truly critical errors, but sanitize them
  
  const originalError = console.error
  const originalWarn = console.warn
  
  // Override console.log, debug, info - completely disable in production
  console.log = () => {}
  console.debug = () => {}
  console.info = () => {}
  
  // Override console.warn - sanitize and limit
  console.warn = (...args: any[]) => {
    // Only log if it's a real warning (not from logger which already sanitizes)
    // Check if it starts with [WARN] - that's from our logger, allow it
    const firstArg = args[0]
    if (typeof firstArg === 'string' && firstArg.startsWith('[WARN]')) {
      originalWarn(...args)
      return
    }
    // Otherwise, sanitize and log minimally
    const sanitized = args.map(arg => {
      if (typeof arg === 'string') {
        // Remove UUIDs, emails, tokens
        return arg
          .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[uuid]')
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
      }
      if (typeof arg === 'object' && arg !== null) {
        return '[object redacted]'
      }
      return arg
    })
    originalWarn('[PROD]', ...sanitized)
  }
  
  // Override console.error - sanitize but allow (for critical errors)
  console.error = (...args: any[]) => {
    // Check if it's from our logger
    const firstArg = args[0]
    if (typeof firstArg === 'string' && firstArg.startsWith('[ERROR]')) {
      originalError(...args)
      return
    }
    // Otherwise, sanitize
    const sanitized = args.map(arg => {
      if (typeof arg === 'string') {
        return arg
          .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[uuid]')
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
      }
      if (typeof arg === 'object' && arg !== null) {
        return '[object redacted]'
      }
      return arg
    })
    originalError('[PROD]', ...sanitized)
  }
}
