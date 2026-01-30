import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/adminSession'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

function checkAuth(req: NextApiRequest) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE]
  return verifyAdminSessionToken(token)
}

/**
 * ADMIN SUB-EVENTS MANAGEMENT ENDPOINT
 * Authentication: Admin session cookie
 * Methods:
 * - GET: Fetch sub-events for an event
 * - POST: Create a new sub-event
 * - PUT: Update a sub-event
 * - DELETE: Delete a sub-event
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ADMIN ONLY: Check authentication
  if (!checkAuth(req)) return res.status(401).json({ error: 'unauthorized' })

  const eventId = req.query.eventId as string

  if (!eventId) {
    return res.status(400).json({ error: 'Missing eventId parameter' })
  }

  // GET: Fetch sub-events for the event
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('sub_events')
        .select('*')
        .eq('event_id', eventId)
        .order('start_time', { ascending: true })

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.json({ subEvents: data || [] })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  // POST: Create a new sub-event
  if (req.method === 'POST') {
    try {
      const {
        title,
        description,
        type,
        start_time,
        end_time,
        location,
        max_capacity,
        speaker_name,
        speaker_email,
        speaker_bio,
        image_url,
        price_inr = 0,
        requires_payment = false,
        status = 'active',
        is_published = true,
        metadata = {}
      } = req.body

      if (!title || !type) {
        return res.status(400).json({ error: 'Missing required fields: title, type' })
      }

      const { data, error } = await supabase
        .from('sub_events')
        .insert([
          {
            event_id: eventId,
            title,
            description,
            type,
            start_time: start_time || null,
            end_time: end_time || null,
            location,
            max_capacity: max_capacity || null,
            current_registrations: 0,
            speaker_name,
            speaker_email,
            speaker_bio,
            image_url,
            price_inr: price_inr || 0,
            requires_payment: requires_payment || false,
            payment_collected: 0,
            status,
            is_published,
            metadata
          }
        ])
        .select()
        .single()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(201).json({ subEvent: data, message: 'Sub-event created successfully' })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  // PUT: Update a sub-event
  if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Missing sub-event id' })
      }

      // Verify sub-event belongs to this event
      const { data: subEvent, error: checkError } = await supabase
        .from('sub_events')
        .select('id, event_id')
        .eq('id', id)
        .maybeSingle()

      if (checkError || !subEvent || subEvent.event_id !== eventId) {
        return res.status(404).json({ error: 'Sub-event not found or does not belong to this event' })
      }

      const { data, error } = await supabase
        .from('sub_events')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.json({ subEvent: data, message: 'Sub-event updated successfully' })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  // DELETE: Delete a sub-event
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Missing sub-event id' })
      }

      // Verify sub-event belongs to this event
      const { data: subEvent, error: checkError } = await supabase
        .from('sub_events')
        .select('id, event_id')
        .eq('id', id)
        .maybeSingle()

      if (checkError || !subEvent || subEvent.event_id !== eventId) {
        return res.status(404).json({ error: 'Sub-event not found or does not belong to this event' })
      }

      const { error } = await supabase
        .from('sub_events')
        .delete()
        .eq('id', id)

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.json({ message: 'Sub-event deleted successfully' })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
