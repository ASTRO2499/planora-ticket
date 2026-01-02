import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

/**
 * ORGANIZER AUTHENTICATION ONLY
 * Validates bearer token with organizer role from Supabase Auth.
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

export const config = { api: { bodyParser: false } }

async function uploadCover(file: formidable.File) {
  const bucketName = 'event-covers'
  try { await supabase.storage.createBucket(bucketName, { public: true }) } catch {}
  const fileBuffer = fs.readFileSync(file.filepath)
  const fileName = `${Date.now()}-${file.originalFilename}`
  const { data, error } = await supabase.storage.from(bucketName).upload(`public/${fileName}`, fileBuffer, { contentType: file.mimetype || 'image/jpeg' })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(`public/${fileName}`)
  return publicUrl
}

/**
 * ORGANIZER AUTHENTICATION ONLY
 * Accepts per-event organizer secret from x-organizer-secret header.
 * DO NOT accept admin session cookies or admin secrets.
 */
function getOrganizerSecret(req: NextApiRequest) {
  const secret = req.headers['x-organizer-secret']
  return typeof secret === 'string' ? secret.trim() : null
}

function parseBoolean(value: any) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : Boolean(value)
  const v = String(value).toLowerCase().trim()
  if (v === 'true' || v === '1' || v === 'on' || v === 'yes') return true
  if (v === 'false' || v === '0' || v === 'off' || v === 'no' || v === '') return false
  return undefined
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

  if (req.method === 'GET') {
    let query = supabase.from('events').select('*').order('created_at', { ascending: false })
    if (organizerSecret) {
      query = query.eq('organizer_id', organizerSecret)
    }
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ events: data })
  }

  if (req.method === 'PUT') {
    try {
      const form = formidable()
      const { fields, files } = await new Promise<any>((resolve, reject) => {
        form.parse(req, (err, f, fl) => err ? reject(err) : resolve({ fields: f, files: fl }))
      })
      const id = Array.isArray(fields.id) ? fields.id[0] : fields.id
      if (!id) return res.status(400).json({ error: 'missing_id' })
      // If organizerSecret is provided, ensure this event belongs to that organizer
      if (organizerSecret) {
        const { data: ev, error: evErr } = await supabase.from('events').select('id, organizer_id').eq('id', id).maybeSingle()
        if (evErr || !ev || ev.organizer_id !== organizerSecret) return res.status(403).json({ error: 'forbidden' })
      }
      const updates: any = {}
      const booleanFields = new Set(['is_published','is_featured','track_coming_soon'])
      const mapField = (name: string) => {
        const raw = Array.isArray((fields as any)[name]) ? (fields as any)[name][0] : (fields as any)[name]
        if (raw === undefined || raw === null || raw === '') return
        if (booleanFields.has(name)) {
          const parsed = parseBoolean(raw)
          if (parsed !== undefined) {
            // Explicitly cast to boolean to prevent string storage
            updates[name] = parsed === true ? true : false
          }
        } else {
          updates[name] = raw
        }
      }
      ;['title','description','date','location','price_inr','is_published','is_featured','track_coming_soon'].forEach(mapField)
      console.log('Event update - final updates object:', updates, 'track_coming_soon:', { value: updates.track_coming_soon, type: typeof updates.track_coming_soon })
      if (files.coverImage?.[0]) {
        updates.image_url = await uploadCover(files.coverImage[0])
      }
      const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single()
      if (error) {
        console.error('Event update error:', error)
        return res.status(500).json({ error: error.message })
      }
      console.log('Event updated successfully:', { id, updates, returned: data, track_coming_soon: { value: data?.track_coming_soon, type: typeof data?.track_coming_soon } })
      return res.json({ event: data })
    } catch (err: any) {
      return res.status(500).json({ error: 'update_failed', detail: err?.message })
    }
  }

  return res.status(405).end()
}
