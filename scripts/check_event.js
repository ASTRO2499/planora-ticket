const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const env = fs.readFileSync('.env.local', 'utf8')
const SUPABASE_URL = env.match(/SUPABASE_URL=(.+)/)?.[1]
const SUPABASE_SERVICE_KEY = env.match(/SUPABASE_SERVICE_KEY=(.+)/)?.[1]

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function checkEvent() {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, organizer_id')
    .eq('id', 'WEB-SUMMIT-25')
    .single()
  
  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('Event found:')
    console.log(JSON.stringify(data, null, 2))
    console.log('\norganizer_id:', data.organizer_id || '(NULL)')
  }
}

checkEvent()
