/**
 * SECURITY: Man-in-the-Middle (MITM) Attack Mitigation
 * Prevents request interception, localhost spoofing, and protocol downgrade attacks
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

/**
 * SECURITY: Enforce HTTPS protocol
 * Rejects any HTTP requests (except localhost for development)
 * Prevents protocol downgrade attacks
 */
export function enforceHttps(req: NextApiRequest, res: NextApiResponse): boolean {
  const protocol = req.headers['x-forwarded-proto'] as string || (req as any).socket?.encrypted ? 'https' : 'http'
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Allow HTTP only for localhost development
  if (protocol === 'http' && !req.headers.host?.includes('localhost:')) {
    console.error('[SECURITY] HTTP request rejected - HTTPS required', {
      protocol,
      host: req.headers.host,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    })
    return false
  }
  
  return true
}

/**
 * SECURITY: Validate request origin to prevent MITM attacks
 * Ensures request comes from expected domain, not proxy/interceptor
 */
export function validateRequestOrigin(req: NextApiRequest): boolean {
  const origin = req.headers.origin
  const referer = req.headers.referer
  const host = req.headers.host
  
  // If origin header present, validate it matches host
  if (origin) {
    try {
      const originUrl = new URL(origin)
      const hostMatch = originUrl.hostname === host?.split(':')[0]
      
      if (!hostMatch) {
        console.warn('[SECURITY] Origin mismatch detected (possible MITM)', {
          origin: originUrl.hostname,
          host: host?.split(':')[0]
        })
        return false
      }
    } catch (err) {
      console.error('[SECURITY] Invalid origin header', { origin })
      return false
    }
  }
  
  // If referer header present, validate it matches host
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const hostMatch = refererUrl.hostname === host?.split(':')[0]
      
      if (!hostMatch) {
        console.warn('[SECURITY] Referer mismatch detected (possible MITM)', {
          referer: refererUrl.hostname,
          host: host?.split(':')[0]
        })
        return false
      }
    } catch (err) {
      console.error('[SECURITY] Invalid referer header', { referer })
      return false
    }
  }
  
  return true
}

/**
 * SECURITY: Prevent localhost spoofing from remote IPs
 * Blocks requests claiming to be localhost from non-localhost IPs
 */
export function validateLocalhost(req: NextApiRequest): boolean {
  const host = req.headers.host
  const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || ''
  const isLocalhostRequest = host?.includes('localhost') || host?.includes('127.0.0.1')
  const isLocalhostIp = ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost')
  
  // If requesting localhost from non-localhost IP, it's a MITM attempt
  if (isLocalhostRequest && !isLocalhostIp) {
    console.error('[SECURITY] Localhost spoofing attempt detected', {
      host,
      ip: ip.split(',')[0]
    })
    return false
  }
  
  // If non-localhost request from localhost IP, suspicious
  if (!isLocalhostRequest && isLocalhostIp && process.env.NODE_ENV === 'production') {
    console.warn('[SECURITY] Non-localhost request from localhost IP (possible proxy)', {
      host,
      ip
    })
    return false
  }
  
  return true
}

/**
 * SECURITY: Generate request integrity signature
 * Creates HMAC signature for request to detect tampering
 * Use this on sensitive operations (payment, admin actions, etc)
 */
export function generateRequestSignature(
  method: string,
  path: string,
  timestamp: number,
  secret: string
): string {
  const message = `${method}|${path}|${timestamp}`
  return crypto.createHmac('sha256', secret).update(message).digest('hex')
}

/**
 * SECURITY: Verify request integrity signature
 * Ensures request wasn't tampered with in transit
 * @param signature The signature from request header
 * @param method HTTP method
 * @param path Request path
 * @param timestamp Request timestamp (reject if > 5 minutes old)
 * @param secret Signing secret
 */
export function verifyRequestSignature(
  signature: string,
  method: string,
  path: string,
  timestamp: number,
  secret: string
): boolean {
  // Reject old requests (timestamp attack prevention)
  const now = Date.now()
  const maxAge = 5 * 60 * 1000 // 5 minutes
  
  if (now - timestamp > maxAge) {
    console.warn('[SECURITY] Stale request signature rejected', {
      age: now - timestamp,
      maxAge
    })
    return false
  }
  
  // Verify signature matches
  const expected = generateRequestSignature(method, path, timestamp, secret)
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
  
  if (!isValid) {
    console.error('[SECURITY] Request signature verification failed (tampering detected)', {
      method,
      path,
      timestamp
    })
  }
  
  return isValid
}

/**
 * SECURITY: Get security headers to prevent MITM attacks
 * Returns object with headers to be set in API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // HTTPS enforcement
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // CSP to prevent injection attacks
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.vercel.com",
    
    // Prevent referrer leakage
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Feature policy
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  }
}

/**
 * SECURITY: Apply security headers to response
 */
export function applySecurityHeaders(res: NextApiResponse): void {
  const headers = getSecurityHeaders()
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value)
  })
}
