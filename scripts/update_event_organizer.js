const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const env = fs.readFileSync('.env.local', 'utf8')
const SUPABASE_URL = env.match(/SUPABASE_URL=(.+)/)?.[1]
const SUPABASE_SERVICE_KEY = env.match(/SUPABASE_SERVICE_KEY=(.+)/)?.[1]

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function updateEvent() {
  console.log('What organizer secret do you want to set for WEB-SUMMIT-25?')
  console.log('Enter the secret you use to log in to the organizer portal:\n')
  
  // For now, let's check all events first
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, organizer_id')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.log('Error:', error.message)
    return
  }
  
  console.log('All events in database:')
  events.forEach(ev => {
    console.log(`- ${ev.title} (${ev.id}) - organizer_id: ${ev.organizer_id || '(NULL)'}`)
  })
  
  const webSummit = events.find(e => e.id.includes('WEB-SUMMIT') || e.title.toLowerCase().includes('web summit'))
  
  if (webSummit) {
    console.log('\n✓ Found Web Summit event:')
    console.log(`  ID: ${webSummit.id}`)
    console.log(`  Title: ${webSummit.title}`)
    console.log(`  Current organizer_id: ${webSummit.organizer_id || '(NULL)'}`)
  } else {
    console.log('\n✗ No Web Summit event found')
  }
}

updateEvent()
