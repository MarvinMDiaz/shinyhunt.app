/**
 * Safe Logger Utility
 * 
 * Centralized logging that sanitizes sensitive data and respects production/development modes.
 * 
 * Rules:
 * - Production: Only warn/error logs, no debug/info
 * - Development: All logs allowed, but sanitized
 * - Never log: IDs, tokens, emails, user objects, raw DB rows, admin state, auth payloads
 */

const isDev = import.meta.env.DEV

/**
 * Sensitive keys that should be redacted from logs
 */
const SENSITIVE_KEYS = new Set([
  'id',
  'user_id',
  'userId',
  'user_id',
  'admin',
  'isAdmin',
  'email',
  'access_token',
  'refresh_token',
  'token',
  'session',
  'auth',
  'code',
  'row',
  'rows',
  'profile',
  'metadata',
  'user',
  'password',
  'secret',
  'key',
  'api_key',
  'private',
  'internal',
  'payload',
  'data',
  'result',
  'response',
  'error',
  'stack',
  'hint',
  'message', // Often contains sensitive info
])

/**
 * Whitelisted safe keys that can be logged
 */
const SAFE_KEYS = new Set([
  'count',
  'length',
  'success',
  'failed',
  'exists',
  'loaded',
  'saved',
  'deleted',
  'created',
  'updated',
  'status',
  'type',
  'name', // Only if it's not PII
  'action',
  'operation',
])

/**
 * Sanitize an object by removing sensitive keys and limiting depth
 */
function sanitizeObject(obj: any, depth: number = 0, maxDepth: number = 2): any {
  if (depth > maxDepth) {
    return '[max depth reached]'
  }

  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Error) {
    // Only include safe error info
    return {
      name: obj.name,
      message: sanitizeString(obj.message),
      // Never include stack traces in production
      ...(isDev ? { stack: '[redacted stack]' } : {}),
    }
  }

  if (Array.isArray(obj)) {
    // For arrays, only log length and type, not contents
    if (depth === 0) {
      return `[array:${obj.length}]`
    }
    return obj.slice(0, 3).map(item => sanitizeObject(item, depth + 1, maxDepth))
  }

  // For objects, create a sanitized version
  const sanitized: Record<string, any> = {}
  let hasSafeKeys = false

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()
    
    // Skip sensitive keys entirely
    if (SENSITIVE_KEYS.has(lowerKey)) {
      continue
    }

    // Allow whitelisted safe keys
    if (SAFE_KEYS.has(lowerKey)) {
      sanitized[key] = sanitizeValue(value, depth, maxDepth)
      hasSafeKeys = true
      continue
    }

    // For other keys, sanitize the value
    const sanitizedValue = sanitizeValue(value, depth, maxDepth)
    if (sanitizedValue !== undefined) {
      sanitized[key] = sanitizedValue
      hasSafeKeys = true
    }
  }

  // If object has no safe keys, return a generic indicator
  if (!hasSafeKeys && Object.keys(obj).length > 0) {
    return '[redacted object]'
  }

  return sanitized
}

/**
 * Sanitize a value based on its type
 */
function sanitizeValue(value: any, depth: number, maxDepth: number): any {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === 'string') {
    return sanitizeString(value)
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'object') {
    return sanitizeObject(value, depth + 1, maxDepth)
  }

  return '[redacted]'
}

/**
 * Sanitize strings to remove potential PII
 */
function sanitizeString(str: string): string {
  // Remove UUIDs
  str = str.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[uuid]')
  
  // Remove email-like patterns (but keep generic messages)
  if (str.includes('@') && str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
    return '[email redacted]'
  }

  // Remove long hex strings (tokens)
  if (str.length > 32 && /^[0-9a-f]+$/i.test(str)) {
    return '[token redacted]'
  }

  return str
}

/**
 * Format log arguments safely
 */
function formatLogArgs(args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeString(arg)
    }
    if (typeof arg === 'object' && arg !== null) {
      return sanitizeObject(arg)
    }
    return arg
  })
}

/**
 * Safe Logger Interface
 * 
 * IMPORTANT: This is the ONLY place in the codebase where console.* should be used.
 * All other code must use logger.debug/info/warn/error instead.
 */
export const logger = {
  /**
   * Debug logs - only in development
   * Completely disabled in production
   */
  debug(...args: any[]): void {
    if (!isDev) return
    const sanitized = formatLogArgs(args)
    console.debug('[DEBUG]', ...sanitized)
  },

  /**
   * Info logs - only in development
   * Completely disabled in production
   */
  info(...args: any[]): void {
    if (!isDev) return
    const sanitized = formatLogArgs(args)
    console.info('[INFO]', ...sanitized)
  },

  /**
   * Warning logs - allowed in all environments, but sanitized
   * Production: Sanitized and minimal
   * Development: Full sanitized logs
   */
  warn(...args: any[]): void {
    const sanitized = formatLogArgs(args)
    console.warn('[WARN]', ...sanitized)
  },

  /**
   * Error logs - allowed in all environments, but sanitized
   * Production: Sanitized and minimal
   * Development: Full sanitized logs
   */
  error(...args: any[]): void {
    const sanitized = formatLogArgs(args)
    console.error('[ERROR]', ...sanitized)
  },
}

/**
 * Helper to create safe log messages with counts/status only
 */
export function safeLog(message: string, safeData?: { count?: number; success?: boolean; status?: string }): void {
  if (!isDev) return
  const safe: Record<string, any> = {}
  if (safeData?.count !== undefined) safe.count = safeData.count
  if (safeData?.success !== undefined) safe.success = safeData.success
  if (safeData?.status !== undefined) safe.status = safeData.status
  
  if (Object.keys(safe).length > 0) {
    logger.debug(message, safe)
  } else {
    logger.debug(message)
  }
}
