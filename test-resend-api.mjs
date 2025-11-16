/**
 * Simple Resend API Test
 * Tests basic connectivity to Resend API
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || 're_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve';

console.log('\n🔍 Testing Resend API Connection');
console.log('━'.repeat(60));
console.log(`API Key: ${RESEND_API_KEY.substring(0, 10)}...`);

const resend = new Resend(RESEND_API_KEY);

// Test 1: Check if Resend client can be instantiated
console.log('\n✓ Resend client instantiated');

// Test 2: Try to send a simple email
console.log('\n📧 Attempting to send test email...');

try {
  const { data, error } = await resend.emails.send({
    from: 'Wasillah Team <noreply@wasillah.live>',
    to: ['delivered@resend.dev'],
    subject: 'Test Email from Wasillah Platform',
    html: '<h1>Test Email</h1><p>This is a test email from the Wasillah platform.</p>',
  });

  if (error) {
    console.log('\n❌ API Error:');
    console.log(JSON.stringify(error, null, 2));
    
    if (error.message && error.message.includes('Unable to fetch data')) {
      console.log('\n⚠️  Diagnosis: API Key Issue');
      console.log('   - The API key may be invalid, expired, or revoked');
      console.log('   - This is a test/example key that is not active');
      console.log('   - You need to get a real API key from resend.com');
    }
  } else {
    console.log('\n✅ Email sent successfully!');
    console.log(`   Email ID: ${data?.id || 'N/A'}`);
    console.log('\n🎉 API key is valid and working!');
  }
} catch (err) {
  console.log('\n❌ Exception occurred:');
  console.log(err.message);
  console.log('\n⚠️  This likely indicates a network or API key issue');
}

console.log('\n' + '━'.repeat(60));
