import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')
const BUCKET = 'ticket-templates'

export const config = { api: { bodyParser: false } }

/**
 * ORGANIZER AUTHENTICATION ONLY
 * Validates bearer token with organizer role.
 * DO NOT accept admin session cookies or admin secrets.
 */
async function requireOrganizer(req: NextApiRequest) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice('Bearer '.length)
  const { data } = await supabase.auth.getUser(token)
  const role = data?.user?.user_metadata?.role
  if (role === 'organizer') return data?.user || null
  return null
}

/**
 * ORGANIZER AUTHENTICATION ONLY
 * Accepts per-event organizer secret.
 * DO NOT accept admin session cookies or admin secrets.
 */
function getOrganizerSecret(req: NextApiRequest) {
  const secret = req.headers['x-organizer-secret']
  return typeof secret === 'string' ? secret.trim() : null
}

async function ensureBucket() {
  try { await supabase.storage.createBucket(BUCKET, { public: false }) } catch {}
}

/**
 * ORGANIZER PORTAL ENDPOINT
 * Authentication: Bearer token (organizer role) OR x-organizer-secret ONLY
 * DO NOT merge with admin authentication
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CRITICAL: Only organizer auth - reject admin session cookies
  const organizer = await requireOrganizer(req)
  const organizerSecret = getOrganizerSecret(req)
  if (!organizer && !organizerSecret) return res.status(401).json({ error: 'unauthorized' })

  if (req.method === 'POST') {
    try {
      await ensureBucket()
      const form = formidable()
      const { fields, files } = await new Promise<any>((resolve, reject) => {
        form.parse(req, (err, flds, fls) => err ? reject(err) : resolve({ fields: flds, files: fls }))
      })
      const eventId = Array.isArray(fields.eventId) ? fields.eventId[0] : fields.eventId
      if (!eventId) return res.status(400).json({ error: 'missing_event_id' })
      // If organizerSecret provided, verify event match
      if (organizerSecret) {
        const { data: ev, error: evErr } = await supabase.from('events').select('id, organizer_id').eq('id', eventId).maybeSingle()
        if (evErr || !ev || ev.organizer_id !== organizerSecret) return res.status(403).json({ error: 'forbidden' })
      }

      const templateFile = files.template?.[0]
      let content: Buffer
      if (templateFile) {
        content = fs.readFileSync(templateFile.filepath)
      } else {
        const raw = Array.isArray(fields.template) ? fields.template[0] : fields.template
        if (!raw) return res.status(400).json({ error: 'missing_template' })
        content = Buffer.from(String(raw), 'utf-8')
      }

      const path = `templates/${eventId}.json`
      const { error } = await supabase.storage.from(BUCKET).upload(path, content, { contentType: 'application/json', upsert: true })
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    } catch (err: any) {
      return res.status(500).json({ error: 'upload_failed', detail: err?.message })
    }
  }

  if (req.method === 'GET') {
    try {
      await ensureBucket()
      const eventId = String(req.query.eventId || '')
      if (!eventId) return res.status(400).json({ error: 'missing_event_id' })
      if (organizerSecret) {
        const { data: ev, error: evErr } = await supabase.from('events').select('id, organizer_id').eq('id', eventId).maybeSingle()
        if (evErr || !ev || ev.organizer_id !== organizerSecret) return res.status(403).json({ error: 'forbidden' })
      }
      const { data, error } = await supabase.storage.from(BUCKET).download(`templates/${eventId}.json`)
      if (error || !data) return res.status(404).json({ error: 'not_found' })
      const text = Buffer.from(await data.arrayBuffer()).toString('utf-8')
      return res.json({ template: JSON.parse(text) })
    } catch (err: any) {
      return res.status(500).json({ error: 'read_failed', detail: err?.message })
    }
  }

  return res.status(405).end()
}
