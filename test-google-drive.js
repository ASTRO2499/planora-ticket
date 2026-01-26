// Test script to verify Google Drive credentials
const credentials = process.env.GOOGLE_DRIVE_CREDENTIALS

console.log('Testing Google Drive Credentials...\n')

if (!credentials) {
  console.error('❌ GOOGLE_DRIVE_CREDENTIALS not found in environment')
  process.exit(1)
}

console.log('✓ GOOGLE_DRIVE_CREDENTIALS exists')
console.log(`   Length: ${credentials.length} characters`)
console.log(`   First 100 chars: ${credentials.substring(0, 100)}...`)

try {
  const parsed = JSON.parse(credentials)
  console.log('\n✓ JSON parsing successful')
  console.log(`   Type: ${parsed.type}`)
  console.log(`   Project ID: ${parsed.project_id}`)
  console.log(`   Client Email: ${parsed.client_email}`)
  console.log(`   Has private_key: ${!!parsed.private_key}`)
  
  if (parsed.private_key) {
    console.log(`   Private key length: ${parsed.private_key.length}`)
    console.log(`   Starts with: ${parsed.private_key.substring(0, 30)}...`)
  }
  
  console.log('\n✅ All credentials look valid!')
} catch (error) {
  console.error('\n❌ JSON parsing failed:')
  console.error(error.message)
  process.exit(1)
}
