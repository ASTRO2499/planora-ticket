// Developed by: Kalidas KJ
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  createSessionCookie,
  clearSessionCookie,
  verifyAdminSessionToken,
} from '../../../lib/adminSession'

const DEFAULT_ADMIN_SECRET = '7532159'
const LEGACY_ADMIN_SECRET = 'akcomsoc892'

function getAdminSecrets(): string[] {
  const envVal = (process.env.ADMIN_SECRET || '').trim()
  const list = envVal ? envVal.split(',').map(s => s.trim()).filter(Boolean) : []
  // Always include defaults for compatibility
  const set = new Set<string>([...list, DEFAULT_ADMIN_SECRET, LEGACY_ADMIN_SECRET])
  return Array.from(set)
}

/**
 * ADMIN AUTHENTICATION ONLY
 * This endpoint handles ONLY admin portal authentication.
 * DO NOT accept organizer credentials (bearer tokens or organizer secrets).
 * DO NOT merge with organizer authentication logic.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const token = req.cookies?.[ADMIN_SESSION_COOKIE]
      const authenticated = verifyAdminSessionToken(token)
      return res.status(200).json({ authenticated })
    }

    if (req.method === 'POST') {
      const { secret } = req.body || {}
      const provided = typeof secret === 'string' ? secret.trim() : ''
      const allowed = getAdminSecrets()
      if (!provided) return res.status(400).json({ error: 'missing_secret' })
      if (!allowed.includes(provided)) return res.status(401).json({ error: 'invalid_secret' })
      const token = createAdminSessionToken()
      res.setHeader('Set-Cookie', createSessionCookie(token))
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      res.setHeader('Set-Cookie', clearSessionCookie())
      return res.status(200).json({ ok: true })
    }
  } catch (err) {
    console.error('admin session error', err)
    return res.status(500).json({ error: 'server_error' })
  }

  return res.status(405).end()
}
