import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle POST for verification
  if (req.method === 'POST') {
    const { data } = req.body
    // data expected to be 'UUID|email'
    const parts = String(data).split('|')
    if (parts.length !== 2) {
      return res.json({ valid: false, reason: 'Invalid QR format' })
    }
    
    const [id, email] = parts
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !ticket) {
      return res.json({ valid: false, reason: 'Ticket not found' })
    }
    
    if (ticket.email !== email) {
      return res.json({ valid: false, reason: 'Email mismatch' })
    }
    
    if (ticket.used) {
      return res.json({ 
        valid: false, 
        reason: `Already used at ${new Date(ticket.used_at).toLocaleString()}` 
      })
    }
    
    if (ticket.status !== 'issued') {
      return res.json({ valid: false, reason: `Ticket status: ${ticket.status}` })
    }
    
    return res.json({ 
      valid: true, 
      id: ticket.id,
      name: ticket.name,
      email: ticket.email,
      event_id: ticket.event_id,
      created_at: ticket.created_at
    })
  }
  
  // Handle PUT for marking as used
  if (req.method === 'PUT') {
    const { ticketId } = req.body
    
    if (!ticketId) {
      return res.status(400).json({ error: 'ticketId required' })
    }
    
    const { error } = await supabase
      .from('tickets')
      .update({ 
        used: true, 
        used_at: new Date().toISOString(),
        checked_in_at: new Date().toISOString()
      })
      .eq('id', ticketId)
    
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    
    return res.json({ success: true })
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}
