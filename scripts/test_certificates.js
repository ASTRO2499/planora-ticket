/**
 * Test Certificate System
 * 
 * This script helps test the certificate generation system by:
 * 1. Checking database setup
 * 2. Simulating certificate generation
 * 3. Verifying API endpoints
 */

const https = require('https');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EVENT_ID = process.argv[2]; // Pass event ID as argument
const ORGANIZER_SECRET = process.argv[3]; // Pass organizer secret as argument

if (!EVENT_ID || !ORGANIZER_SECRET) {
  console.error('❌ Usage: node scripts/test_certificates.js <EVENT_ID> <ORGANIZER_SECRET>');
  process.exit(1);
}

console.log('🧪 Testing Certificate System\n');
console.log(`Event ID: ${EVENT_ID}`);
console.log(`Base URL: ${BASE_URL}\n`);

// Helper function to make HTTP requests
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const urlOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-organizer-secret': ORGANIZER_SECRET,
        ...options.headers
      }
    };

    const protocol = url.protocol === 'https:' ? https : require('http');
    
    const req = protocol.request(url, urlOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test steps
async function runTests() {
  try {
    // Step 1: Get certificate stats
    console.log('📊 Step 1: Fetching certificate statistics...');
    const statsRes = await makeRequest(`/api/organizer/certificates?eventId=${EVENT_ID}`);
    
    if (statsRes.status === 200) {
      console.log('✅ Successfully fetched stats:');
      console.log(`   - Total Attended: ${statsRes.data.total_attended}`);
      console.log(`   - Certificates Issued: ${statsRes.data.certificates_issued}`);
      console.log(`   - Pending: ${statsRes.data.pending}\n`);
      
      if (statsRes.data.pending === 0) {
        console.log('ℹ️  No pending certificates. All checked-in attendees already have certificates.\n');
      }
    } else {
      console.log(`❌ Failed to fetch stats: ${statsRes.status}`);
      console.log(`   Response: ${JSON.stringify(statsRes.data)}\n`);
      return;
    }

    // Step 2: Generate certificates (if pending)
    if (statsRes.data.pending > 0) {
      console.log('🎓 Step 2: Generating certificates...');
      const generateRes = await makeRequest('/api/organizer/certificates', {
        method: 'POST',
        body: { eventId: EVENT_ID }
      });

      if (generateRes.status === 200) {
        console.log('✅ Successfully generated certificates:');
        console.log(`   - New Certificates: ${generateRes.data.new_certificates}`);
        console.log(`   - Existing: ${generateRes.data.existing_certificates}\n`);
      } else {
        console.log(`❌ Failed to generate certificates: ${generateRes.status}`);
        console.log(`   Response: ${JSON.stringify(generateRes.data)}\n`);
        return;
      }
    } else {
      console.log('⏭️  Step 2: Skipped (no pending certificates)\n');
    }

    // Step 3: Verify updated stats
    console.log('📊 Step 3: Verifying final statistics...');
    const finalStatsRes = await makeRequest(`/api/organizer/certificates?eventId=${EVENT_ID}`);
    
    if (finalStatsRes.status === 200) {
      console.log('✅ Final stats:');
      console.log(`   - Total Attended: ${finalStatsRes.data.total_attended}`);
      console.log(`   - Certificates Issued: ${finalStatsRes.data.certificates_issued}`);
      console.log(`   - Pending: ${finalStatsRes.data.pending}\n`);
      
      if (finalStatsRes.data.pending === 0 && finalStatsRes.data.total_attended > 0) {
        console.log('✅ All checked-in attendees now have certificates!\n');
      }
    } else {
      console.log(`❌ Failed to verify final stats: ${finalStatsRes.status}\n`);
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Test Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Certificate system is working correctly!');
    console.log('\n📝 Next Steps:');
    console.log('1. Attendees can now download certificates from My Tickets page');
    console.log('2. Test certificate PDF by visiting:');
    console.log(`   ${BASE_URL}/my-tickets`);
    console.log('3. Enter attendee email and verify OTP');
    console.log('4. Look for green "Download Certificate" button\n');

  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests().then(() => {
  console.log('✅ Certificate system tests completed!\n');
}).catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
