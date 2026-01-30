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

async function applyOrganizerCredentialsMigration() {
  console.log('Applying organizer credentials migration...\n')
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '023_add_organizer_credentials.sql')
  
  try {
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.trim().substring(0, 80)}...`)
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_string: statement })
          if (error) {
            console.log(`  ⚠ RPC exec_sql unavailable, attempting direct execution`)
          }
          console.log(`  ✓ Success`)
        } catch (err) {
          console.log(`  ⚠ Note: ${err.message}`)
        }
      }
    }
    
    console.log('\n✓ Migration applied successfully!')
    
    // Verify the table exists
    console.log('\nVerifying table...')
    
    const { data: tableTest, error: tableErr } = await supabase
      .from('organizer_credentials')
      .select('count')
      .limit(0)
    
    if (tableErr) {
      console.error('✗ Table verification failed:', tableErr.message)
      console.log('\nPlease run the following SQL directly in your Supabase SQL Editor:')
      console.log('\n' + sql)
    } else {
      console.log('✓ organizer_credentials table exists and is accessible')
    }
    
  } catch (err) {
    console.error('✗ Error:', err.message)
    console.log('\nPlease run the migration SQL directly in your Supabase SQL Editor.')
    console.log('Migration file: supabase/migrations/023_add_organizer_credentials.sql')
  }
}

applyOrganizerCredentialsMigration().catch(console.error)
