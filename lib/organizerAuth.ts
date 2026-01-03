/**
 * SECURITY: Organizer Authentication Utilities
 * Shared across all organizer API endpoints
 * Provides rate limiting and logging for organizer secret validation
 * Prevents brute-force and sniper attacks from unauthorized IPs
 */
import type { NextApiRequest } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

// SECURITY: Rate limiting in-memory store (single-process assumption)
// TODO: Replace with Redis for multi-process/distributed deployments
const attemptCache = new Map<string, { count: number; resetTime: number }>()
const ipFailureCache = new Map<string, { failures: number; blockedUntil: number; resetTime: number }>()

const RATE_LIMIT_ATTEMPTS = 10
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute

// IP-level rate limiting: Block IPs after too many failures
const IP_FAILURE_THRESHOLD = 50  // Failed attempts across all secrets/endpoints
const IP_FAILURE_WINDOW_MS = 300000  // 5 minutes
const IP_BLOCK_DURATION_MS = 600000  // 10 minutes (temporary block)

/**
 * SECURITY: Check rate limiting for organizer authentication attempts
 * Prevents brute force attacks on organizer secret guessing per secret
 * Also validates IP isn't globally blocked
 * @param secret The organizer secret (only first 3 chars used in cache key)
 * @param ip The client IP address
 * @returns true if attempt is allowed, false if rate limited or IP blocked
 */
export function checkOrganizerRateLimit(secret: string, ip: string): boolean {
  // SECURITY: Check if IP is globally blocked from repeated attacks
  if (isIpBlocked(ip)) {
    return false
  }
  const key = `${ip}:${secret.slice(0, 3)}`  // Use first 3 chars to avoid exposing full secret
  const now = Date.now()
  const record = attemptCache.get(key)
  
  if (!record || now > record.resetTime) {
    attemptCache.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  
  if (record.count >= RATE_LIMIT_ATTEMPTS) {
    console.warn('[SECURITY] Rate limit exceeded for organizer auth', {
      ip,
      secretPrefix: secret.slice(0, 3),
      attempts: record.count,
      window: 'per_minute'
    })
    return false
  }
  
  record.count++
  return true
}

/**
 * SECURITY: Check if IP is globally blocked due to repeated attack attempts
 * Implements temporary IP ban after threshold exceeded
 * @param ip The client IP address
 * @returns true if IP is blocked, false if allowed
 */
function isIpBlocked(ip: string): boolean {
  const record = ipFailureCache.get(ip)
  if (!record) return false
  
  const now = Date.now()
  
  // If block period has expired, allow access again
  if (now > record.blockedUntil) {
    ipFailureCache.delete(ip)
    return false
  }
  
  // IP is currently blocked
  return true
}

/**
 * SECURITY: Record failed authentication attempt for IP-level tracking
 * Blocks IP temporarily after exceeding threshold
 * @param ip The client IP address
 */
export function recordAuthFailure(ip: string): void {
  const now = Date.now()
  let record = ipFailureCache.get(ip)
  
  if (!record || now > record.resetTime) {
    // New record or window expired
    record = { failures: 1, blockedUntil: 0, resetTime: now + IP_FAILURE_WINDOW_MS }
  } else {
    record.failures++
    
    // Block IP if threshold exceeded
    if (record.failures >= IP_FAILURE_THRESHOLD) {
      record.blockedUntil = now + IP_BLOCK_DURATION_MS
      console.warn('[SECURITY] IP temporarily blocked due to too many failures', {
        ip,
        failures: record.failures,
        blockedUntil: new Date(record.blockedUntil).toISOString()
      })
    }
  }
  
  ipFailureCache.set(ip, record)
}

/**
 * SECURITY: Reset failure count for IP after successful authentication
 * @param ip The client IP address
 */
export function resetIpFailureCount(ip: string): void {
  // Don't delete if currently blocked - keep the block active
  const record = ipFailureCache.get(ip)
  if (record && Date.now() <= record.blockedUntil) {
    return
  }
  ipFailureCache.delete(ip)
}

/**
 * Extract organizer secret from x-organizer-secret header
 * @param req Next.js API request
 * @returns Trimmed secret string or null
 */
export function getOrganizerSecret(req: NextApiRequest): string | null {
  const secret = req.headers['x-organizer-secret']
  const trimmed = typeof secret === 'string' ? secret.trim() : null
  // SECURITY: Reject empty, whitespace-only, or overly short secrets
  if (!trimmed || trimmed.length < 5) return null
  return trimmed
}

/**
 * Validate organizer bearer token with Supabase Auth
 * @param req Next.js API request
 * @returns User object if valid organizer, null otherwise
 */
export async function requireOrganizerToken(req: NextApiRequest) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice('Bearer '.length)
  const { data } = await supabase.auth.getUser(token)
  const role = data?.user?.user_metadata?.role
  if (role === 'organizer') return data?.user || null
  return null
}

/**
 * Get client IP address from request
 * @param req Next.js API request
 * @returns IP address string
 */
export function getClientIp(req: NextApiRequest): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
         req.socket.remoteAddress || 
         'unknown'
}

/**
 * Log authentication attempt
 * @param type Type of auth attempt (success, failure, rate_limit, blocked)
 * @param details Additional context
 */
export function logAuthAttempt(
  type: 'success' | 'failure' | 'rate_limit' | 'blocked',
  details: Record<string, any>
) {
  const timestamp = new Date().toISOString()
  console.log(`[ORGANIZER_AUTH_${type.toUpperCase()}] ${timestamp}`, details)
}
