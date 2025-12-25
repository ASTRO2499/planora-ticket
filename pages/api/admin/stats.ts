import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/adminSession'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

/**
 * ADMIN AUTHENTICATION ONLY
 * This function validates ONLY admin session cookies.
 * DO NOT accept bearer tokens or organizer secrets.
 */
function checkAuth(req: NextApiRequest) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE]
  return verifyAdminSessionToken(token)
}

/**
 * ADMIN PORTAL ENDPOINT
 * Authentication: Admin session cookie ONLY
 * DO NOT merge with organizer authentication
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CRITICAL: Only admin session auth - reject all organizer credentials
  if (!checkAuth(req)) return res.status(403).json({ error: 'unauthorized' })
  if (req.method !== 'GET') return res.status(405).end()

  const eventId = (req.query.eventId as string) || 'AKCOMSOC2025'

  try {
    const { count: totalCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', eventId)
    const { count: usedCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('used', true)
    const { count: pendingCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'pending')
    const { count: issuedCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'issued')
    const { count: failedCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'failed')

    const revenue = (issuedCount || 0) * 1000
    const absentees = Math.max(0, (issuedCount || 0) - (usedCount || 0))
    const checkInRate = (issuedCount || 0) > 0 ? Number(((usedCount || 0) / (issuedCount || 0)) * 100).toFixed(1) : 0
    const issueRate = (totalCount || 0) > 0 ? Number(((issuedCount || 0) / (totalCount || 0)) * 100).toFixed(1) : 0

    const { data: recentTickets } = await supabase.from('tickets').select('*').eq('event_id', eventId).order('created_at', { ascending: false }).limit(10)
    const { data: all } = await supabase.from('tickets').select('college, created_at').eq('event_id', eventId).limit(2000)

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
    Object.entries(collegeMap).sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([name, count])=>topColleges.push({ name, count }))
    Object.entries(dayMap).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([day, count])=>dailyCounts.push({ day, count }))

    return res.json({
      eventId,
      total: totalCount || 0,
      used: usedCount || 0,
      valid: (totalCount || 0) - (usedCount || 0),
      pending: pendingCount || 0,
      issued: issuedCount || 0,
      failed: failedCount || 0,
      revenue,
      absentees,
      checkInRate: Number(checkInRate),
      issueRate: Number(issueRate),
      topColleges,
      dailyCounts,
      recentTickets: recentTickets || []
    })
  } catch (err) {
    console.error('stats error', err)
    return res.status(500).json({ error: 'server_error' })
  }
}
