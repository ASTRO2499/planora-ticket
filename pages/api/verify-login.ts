import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

interface VerifyLoginRequest {
  username: string
  password: string
  eventId?: string // Optional: if provided, verify user belongs to this event
}

interface VerifyLoginResponse {
  success: boolean
  username?: string
  eventId?: string
  sessionToken?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyLoginResponse>
) {
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { username, password, eventId } = req.body as VerifyLoginRequest

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'username and password are required'
      })
    }

    // Query for matching credentials
    let query = supabase
      .from('organizer_credentials')
      .select('id, event_id, username, password_hash, is_active')
      .eq('username', username.trim())
      .eq('is_active', true)

    // If eventId provided, verify user belongs to this event
    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: credentials, error: queryError } = await query.maybeSingle()

    if (queryError || !credentials) {
      // Generic error to prevent username enumeration
      console.warn(`[AUTH] Failed login attempt for username: ${username}`)
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      })
    }

    // Verify password using bcrypt
    const passwordMatch = await bcrypt.compare(password, credentials.password_hash)

    if (!passwordMatch) {
      console.warn(`[AUTH] Failed password for username: ${username}`)
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      })
    }

    // Update last_used_at timestamp
    try {
      await supabase
        .from('organizer_credentials')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', credentials.id)
    } catch (err: any) {
      console.error('Failed to update last_used_at:', err)
    }

    // Generate a simple session token (in production, use JWT or more secure methods)
    // Format: base64(credentialId:username:timestamp:eventId)
    const tokenData = `${credentials.id}:${credentials.username}:${Date.now()}:${credentials.event_id}`
    const sessionToken = Buffer.from(tokenData).toString('base64')

    console.log(`[AUTH] Successful login for username: ${username}, event: ${credentials.event_id}`)

    return res.status(200).json({
      success: true,
      username: credentials.username,
      eventId: credentials.event_id,
      sessionToken
    })
  } catch (err: any) {
    console.error('[AUTH] Login error:', err)
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}
