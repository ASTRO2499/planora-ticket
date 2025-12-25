import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

/**
 * ORGANIZER AUTHENTICATION ONLY
 * Accepts per-event organizer secret.
 * DO NOT accept admin session cookies or admin secrets.
 */
function getOrganizerSecret(req: NextApiRequest) {
  const secret = req.headers['x-organizer-secret']
  return typeof secret === 'string' ? secret.trim() : null
}

/**
 * ORGANIZER AUTHENTICATION ONLY
 * Validates bearer token with organizer role.
 * DO NOT accept admin session cookies or admin secrets.
 */
async function requireOrganizerId(req: NextApiRequest) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice('Bearer '.length)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  const role = data.user.user_metadata?.role
  if (role !== 'organizer') return null
  return data.user.id as string
}

/**
 * ORGANIZER PORTAL ENDPOINT
 * Authentication: Bearer token (organizer role) OR x-organizer-secret ONLY
 * DO NOT merge with admin authentication
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const eventId = String(req.query.eventId || '')
  if (!eventId) return res.status(400).json({ error: 'missing_event_id' })

  // CRITICAL: Only organizer auth - reject admin session cookies
  const organizerSecret = getOrganizerSecret(req)
  const organizerId = await requireOrganizerId(req)
  if (!organizerSecret && !organizerId) return res.status(401).json({ error: 'unauthorized' })

  const { data: ev, error: evErr } = await supabase
    .from('events')
    .select('id, organizer_id')
    .eq('id', eventId)
    .maybeSingle()
  if (evErr || !ev) return res.status(403).json({ error: 'forbidden' })
  if (organizerSecret && ev.organizer_id !== organizerSecret) return res.status(403).json({ error: 'forbidden' })

  try {
    const { count: total } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', eventId)
    const { count: used } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('used', true)
    const { count: pending } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'pending')
    const { count: issued } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'issued')
    const { count: failed } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'failed')

    const revenue = (issued || 0) * 1000
    const absentees = Math.max(0, (issued || 0) - (used || 0))
    const checkInRate = (issued || 0) > 0 ? Number(((used || 0) / (issued || 0)) * 100).toFixed(1) : 0
    const issueRate = (total || 0) > 0 ? Number(((issued || 0) / (total || 0)) * 100).toFixed(1) : 0

    const { data: all } = await supabase
      .from('tickets')
      .select('college, created_at')
      .eq('event_id', eventId)
      .limit(2000)

    const topColleges: Array<{ name: string, count: number }> = []
    const collegeMap: { [key: string]: number } = {}
    const dailyCounts: Array<{ day: string, count: number }> = []
    const dayMap: { [day: string]: number } = {};

    (all || []).forEach((t: any) => {
      const c = (t.college || '').trim()
      if (c) collegeMap[c] = (collegeMap[c] || 0) + 1
      const day = new Date(t.created_at).toISOString().slice(0, 10)
      dayMap[day] = (dayMap[day] || 0) + 1
    })
    Object.entries(collegeMap)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,5)
      .forEach(([name, count])=>topColleges.push({ name, count }))
    Object.entries(dayMap)
      .sort((a,b)=>a[0].localeCompare(b[0]))
      .forEach(([day, count])=>dailyCounts.push({ day, count }))

    return res.json({
      eventId,
      total: total || 0,
      used: used || 0,
      pending: pending || 0,
      issued: issued || 0,
      failed: failed || 0,
      revenue,
      absentees,
      checkInRate: Number(checkInRate),
      issueRate: Number(issueRate),
      topColleges,
      dailyCounts,
    })
  } catch (err) {
    console.error('organizer analytics error', err)
    return res.status(500).json({ error: 'server_error' })
  }
}
