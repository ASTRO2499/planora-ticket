const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const value = match[2].trim().replace(/^["']|["']$/g, '') // Remove surrounding quotes
      process.env[match[1].trim()] = value
    }
  })
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function applyMigrations() {
  const migrations = [
    {
      name: '010_add_ticket_extra_fields.sql',
      path: path.join(__dirname, '..', 'supabase', 'migrations', '010_add_ticket_extra_fields.sql')
    },
    {
      name: '011_event_form_settings.sql',
      path: path.join(__dirname, '..', 'supabase', 'migrations', '011_event_form_settings.sql')
    }
  ]

  console.log('Applying migrations...\n')

  for (const migration of migrations) {
    console.log(`Applying ${migration.name}...`)
    try {
      const sql = fs.readFileSync(migration.path, 'utf8')
      const { error } = await supabase.rpc('exec_sql', { sql_string: sql }).catch(async () => {
        // If RPC doesn't exist, try direct query
        const statements = sql.split(';').filter(s => s.trim())
        for (const statement of statements) {
          if (statement.trim()) {
            const { error: err } = await supabase.rpc('query', { query_text: statement })
            if (err && !err.message?.includes('already exists')) {
              console.error(`  Error: ${err.message}`)
            }
          }
        }
        return { error: null }
      })
      
      if (error && !error.message?.includes('already exists')) {
        console.error(`  ✗ Failed: ${error.message}`)
      } else {
        console.log(`  ✓ Applied successfully`)
      }
    } catch (err) {
      console.error(`  ✗ Error reading file: ${err.message}`)
    }
  }

  // Test if tables exist
  console.log('\nVerifying tables...')
  
  // Check tickets table has extra columns
  const { data: ticketCols, error: ticketErr } = await supabase
    .from('tickets')
    .select('extra1, extra2, extra3, extra4, extra5')
    .limit(1)
  
  if (ticketErr) {
    console.error('✗ Tickets extra columns not found:', ticketErr.message)
  } else {
    console.log('✓ Tickets table has extra columns')
  }

  // Check event_form_settings table
  const { data: formSettings, error: formErr } = await supabase
    .from('event_form_settings')
    .select('*')
    .limit(1)
  
  if (formErr) {
    console.error('✗ event_form_settings table not found:', formErr.message)
  } else {
    console.log('✓ event_form_settings table exists')
  }

  console.log('\nMigration check complete!')
}

applyMigrations().catch(console.error)
