import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// use service key on server so we can generate signed URLs
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || 'sb_publishable_A2-b3mUEim_YMeXFFzwO3w_3jEaZRwp')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const { data, error } = await supabase.from('tickets').select('*').eq('id', id).single()
  if (error || !data) return res.status(404).json({ error: 'not_found' })

  // attempt to create a signed URL for the PDF in storage (bucket 'tickets', file `${id}.pdf`)
  try {
    const bucket = 'tickets'
    const filePath = `${String(id)}.pdf`
    const expires = Number(process.env.STORAGE_URL_EXPIRES || '604800')
    const { data: signed, error: signedErr } = await supabase.storage.from(bucket).createSignedUrl(filePath, expires)
    if (!signedErr && signed?.signedUrl) {
      // attach pdfUrl to response
      return res.json({ ...data, pdfUrl: signed.signedUrl })
    }
  } catch (e) {
    console.error('signed url generation error', e)
  }

  // fallback: return ticket data without pdfUrl
  return res.json(data)
}
