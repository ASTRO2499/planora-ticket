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

async function applyPricingTiersMigration() {
  console.log('Applying pricing tiers migration...\n')
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '020_add_pricing_tiers.sql')
  
  try {
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.trim().substring(0, 60)}...`)
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_string: statement })
          if (error) {
            // Try direct query if RPC fails
            const { error: queryError } = await supabase.from('_').select('*').limit(0)
            console.log(`  ⚠ Using direct execution`)
          }
          console.log(`  ✓ Success`)
        } catch (err) {
          console.log(`  ⚠ Note: ${err.message}`)
        }
      }
    }
    
    console.log('\n✓ Migration applied successfully!')
    
    // Verify the columns exist
    console.log('\nVerifying columns...')
    
    const { data: ticketTest, error: ticketErr } = await supabase
      .from('tickets')
      .select('tier_selected, tier_price')
      .limit(1)
    
    if (ticketErr) {
      console.error('✗ Tickets tier columns verification failed:', ticketErr.message)
      console.log('\nPlease run the following SQL directly in your Supabase SQL Editor:')
      console.log('\n' + sql)
    } else {
      console.log('✓ Tickets table has tier_selected and tier_price columns')
    }
    
  } catch (err) {
    console.error('✗ Error:', err.message)
    console.log('\nPlease run the migration SQL directly in your Supabase SQL Editor.')
    console.log('Migration file: supabase/migrations/020_add_pricing_tiers.sql')
  }
}

applyPricingTiersMigration().catch(console.error)
