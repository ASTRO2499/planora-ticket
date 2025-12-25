import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

// Static AKCOMSOC 2025 event
const AKCOMSOC_EVENT = {
  id: 'akcomsoc-2025',
  title: 'AKCOMSOC 2025',
  description: 'A focused deep dive into 5G networks and Communication IoT—latency, edge computing, massive device orchestration, and secure protocols powering next-gen applications from smart campuses to industry automation.',
  price_inr: 1000,
  image_url: null,
  is_published: true,
  created_at: new Date(),
  is_featured: true
}

export const config = {
  api: {
    bodyParser: false,
  },
}

async function parseFormData(req: NextApiRequest) {
  const form = formidable()
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      resolve({ fields, files })
    })
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { fields, files } = await parseFormData(req) as any
      
      const title = Array.isArray(fields.title) ? fields.title[0] : fields.title
      const description = Array.isArray(fields.description) ? fields.description[0] : fields.description
      const price = Array.isArray(fields.price) ? fields.price[0] : fields.price
      const organizer_id = Array.isArray((fields as any).organizer_id) ? (fields as any).organizer_id[0] : (fields as any).organizer_id
      const date = Array.isArray(fields.date) ? fields.date[0] : fields.date
      const location = Array.isArray(fields.location) ? fields.location[0] : fields.location
      const coverImage = files.coverImage?.[0]

      if (!title || !description || !price) {
        return res.status(400).json({ error: 'missing_required_fields' })
      }

      let imageUrl = null

      // Upload image to Supabase Storage if provided
      if (coverImage) {
        try {
          const fileBuffer = fs.readFileSync(coverImage.filepath)
          const fileName = `${Date.now()}-${coverImage.originalFilename}`
          
          // Ensure bucket exists (create if it doesn't)
          const bucketName = 'event-covers'
          const { data: buckets } = await supabase.storage.listBuckets()
          const bucketExists = buckets?.some(b => b.name === bucketName)
          
          if (!bucketExists) {
            const { error: createError } = await supabase.storage.createBucket(bucketName, {
              public: true,
            })
            if (createError && !createError.message.includes('already exists')) {
              console.warn('Could not create bucket:', createError)
            }
          }
          
          const { data, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(`public/${fileName}`, fileBuffer, {
              contentType: coverImage.mimetype || 'image/jpeg',
            })

          if (uploadError) {
            console.error('Image upload error:', uploadError)
          } else if (data) {
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(`public/${fileName}`)
            imageUrl = publicUrl
          }
        } catch (err) {
          console.error('Image processing error:', err)
          // Continue without image if upload fails
        }
      }

      const { data, error } = await supabase.from('events').insert({
        title: title.trim(),
        description: description.trim(),
        date: date || null,
        location: location?.trim() || null,
        price_inr: parseInt(price) || 0,
        image_url: imageUrl,
        organizer_id: organizer_id || null,
        is_published: true,
        created_at: new Date(),
      }).select()

      if (error) {
        console.error('Supabase insert error:', error)
        return res.status(500).json({ error: error.message })
      }
      
      if (!data || data.length === 0) {
        return res.status(500).json({ error: 'no_data_returned' })
      }
      
      return res.json({ event: data[0] })
    } catch (err) {
      console.error('event creation error', err)
      return res.status(500).json({ error: 'server_error', details: String(err) })
    }
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase fetch error:', error)
        return res.status(500).json({ error: error.message })
      }
      
      // Combine static AKCOMSOC event with dynamic events
      const allEvents = [AKCOMSOC_EVENT, ...(data || [])]
      return res.json({ events: allEvents })
    } catch (err) {
      console.error('fetch events error', err)
      return res.status(500).json({ error: 'server_error', details: String(err) })
    }
  }

  res.status(405).end()
}
