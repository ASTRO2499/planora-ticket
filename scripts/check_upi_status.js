#!/usr/bin/env node

/**
 * UPI Payment Status Checker
 * Checks if UPI is enabled for events and displays current configuration
 */

const { createClient } = require('@supabase/supabase-js');

async function checkUpiStatus() {
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    process.exit(1);
  }

  try {
    console.log('\n🔍 Checking UPI Payment Configuration...\n');

    // Check if columns exist
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, upi_enabled, upi_id')
      .limit(10);

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError.message);
      process.exit(1);
    }

    if (!events || events.length === 0) {
      console.warn('⚠️  No events found in database');
      console.log('\nTo test UPI payments, you need to:');
      console.log('1. Create an event through the organizer dashboard');
      console.log('2. Navigate to the UPI Payments tab');
      console.log('3. Enable UPI payments and enter your UPI ID');
      process.exit(0);
    }

    console.log(`📊 Found ${events.length} event(s):\n`);

    events.forEach((event, idx) => {
      const status = event.upi_enabled ? '✅ ENABLED' : '❌ DISABLED';
      const upiId = event.upi_id ? `(${event.upi_id})` : '(No UPI ID set)';
      console.log(`${idx + 1}. ${event.title}`);
      console.log(`   Event ID: ${event.id}`);
      console.log(`   UPI Status: ${status} ${upiId}\n`);
    });

    // Check upi_payments table
    const { data: payments, error: paymentsError } = await supabase
      .from('upi_payments')
      .select('id, status, created_at')
      .limit(5);

    if (!paymentsError && payments) {
      console.log(`\n💳 UPI Payment Submissions: ${payments.length} total`);
      if (payments.length > 0) {
        const statusCounts = {};
        payments.forEach(p => {
          statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        });
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`   - ${status}: ${count}`);
        });
      }
    }

    console.log('\n📝 To Enable UPI for an Event:');
    console.log('1. Open organizer.tsx or navigate to /organizer in your browser');
    console.log('2. Select an event');
    console.log('3. Click "UPI Payments" button (💳 icon)');
    console.log('4. Check "Allow delegates to pay via UPI"');
    console.log('5. Enter your UPI ID (e.g., yourname@okaxis)');
    console.log('6. Click "Save UPI Settings"');
    console.log('\n✨ After enabling, the event registration page will show UPI option!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkUpiStatus();
