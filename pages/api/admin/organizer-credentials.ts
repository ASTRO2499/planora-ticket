import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/adminSession'
import bcrypt from 'bcrypt'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

function checkAuth(req: NextApiRequest) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE]
  return verifyAdminSessionToken(token)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ADMIN ONLY: Check authentication
  const auth = checkAuth(req)
  if (!auth) return res.status(401).json({ error: 'unauthorized' })

  const { eventId } = req.query

  if (!eventId) {
    return res.status(400).json({ error: 'eventId is required' })
  }

  // GET: Fetch all credentials for an event
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('organizer_credentials')
        .select('id, event_id, username, is_active, created_by, created_at, updated_at, last_used_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.json({ credentials: data || [] })
    } catch (err: any) {
      console.error('Error fetching credentials:', err)
      return res.status(500).json({ error: 'Failed to fetch credentials' })
    }
  }

  // POST: Create new organizer credential
  if (req.method === 'POST') {
    try {
      const { username, password } = req.body

      if (!username || !password) {
        return res.status(400).json({ error: 'username and password are required' })
      }

      if (username.length < 3 || username.length > 50) {
        return res.status(400).json({ error: 'username must be 3-50 characters' })
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'password must be at least 6 characters' })
      }

      // Check if username already exists for this event
      const { data: existing } = await supabase
        .from('organizer_credentials')
        .select('id')
        .eq('event_id', eventId)
        .eq('username', username)
        .maybeSingle()

      if (existing) {
        return res.status(400).json({ error: 'username already exists for this event' })
      }

      // Hash password using bcrypt
      const password_hash = await bcrypt.hash(password, 10)

      // Get admin info from session
      const adminId = 'admin' // Session only provides boolean, use generic admin id

      const { data, error } = await supabase
        .from('organizer_credentials')
        .insert([
          {
            event_id: eventId,
            username: username.trim(),
            password_hash,
            is_active: true,
            created_by: adminId
          }
        ])
        .select('id, event_id, username, is_active, created_by, created_at, updated_at')
        .single()

      if (error) {
        console.error('Creation error:', error)
        return res.status(500).json({ error: error.message })
      }

      return res.status(201).json({
        credential: data,
        message: 'Organizer credential created successfully'
      })
    } catch (err: any) {
      console.error('Error creating credential:', err)
      return res.status(500).json({ error: 'Failed to create credential' })
    }
  }

  // PUT: Update organizer credential (password, active status)
  if (req.method === 'PUT') {
    try {
      const { id, password, is_active } = req.body

      if (!id) {
        return res.status(400).json({ error: 'credential id is required' })
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ error: 'password must be at least 6 characters' })
        }
        updateData.password_hash = await bcrypt.hash(password, 10)
      }

      if (is_active !== undefined) {
        updateData.is_active = is_active
      }

      // Verify credential belongs to this event
      const { data: credential, error: checkError } = await supabase
        .from('organizer_credentials')
        .select('event_id')
        .eq('id', id)
        .maybeSingle()

      if (checkError || !credential || credential.event_id !== eventId) {
        return res.status(404).json({ error: 'credential not found' })
      }

      const { data, error } = await supabase
        .from('organizer_credentials')
        .update(updateData)
        .eq('id', id)
        .select('id, event_id, username, is_active, created_by, created_at, updated_at')
        .single()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.json({
        credential: data,
        message: 'Credential updated successfully'
      })
    } catch (err: any) {
      console.error('Error updating credential:', err)
      return res.status(500).json({ error: 'Failed to update credential' })
    }
  }

  // DELETE: Remove organizer credential
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'credential id is required' })
      }

      // Verify credential belongs to this event
      const { data: credential, error: checkError } = await supabase
        .from('organizer_credentials')
        .select('event_id')
        .eq('id', id)
        .maybeSingle()

      if (checkError || !credential || credential.event_id !== eventId) {
        return res.status(404).json({ error: 'credential not found' })
      }

      const { error } = await supabase
        .from('organizer_credentials')
        .delete()
        .eq('id', id)

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.json({ message: 'Credential deleted successfully' })
    } catch (err: any) {
      console.error('Error deleting credential:', err)
      return res.status(500).json({ error: 'Failed to delete credential' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
