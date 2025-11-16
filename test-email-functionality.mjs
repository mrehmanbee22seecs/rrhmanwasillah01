/**
 * Email Functionality Test Script
 * 
 * This script tests all email functions to verify they work correctly
 * with the Resend API on Firebase Spark plan.
 * 
 * Usage:
 *   node test-email-functionality.mjs
 */

import { Resend } from 'resend';

// Configuration
const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || 're_gjBe41Rq_C9nKeCytkx1xnmtJBHXn88he';
const SENDER_EMAIL = process.env.VITE_RESEND_SENDER_EMAIL || 'noreply@wasillah.live';
const TEST_RECIPIENT = process.env.TEST_EMAIL || 'test@example.com'; // Change this to your email for testing

// Brand styling constants (matching resendEmailService.ts)
const brand = {
  gradient: 'linear-gradient(135deg, #FF6B9D, #00D9FF)',
  headerBg: '#0F0F23',
  accent: '#FF6B9D',
  textDark: '#2C3E50',
  textLight: '#ffffff'
};

// Initialize Resend
const resend = new Resend(RESEND_API_KEY);

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Helper function to send test email
 */
async function sendTestEmail(emailData) {
  try {
    const { data, error } = await resend.emails.send({
      from: `Wasillah Test <${SENDER_EMAIL}>`,
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
    });

    if (error) {
      return { success: false, error: error };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Test 1: Welcome Email
 */
async function testWelcomeEmail() {
  console.log('\n📧 Test 1: Welcome Email (Student Role)');
  console.log('━'.repeat(60));
  
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
      <div style="background: ${brand.gradient}; padding: 30px 20px; text-align: center;">
        <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">Welcome, Student!</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px 24px;">
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Hi <strong>Test User</strong>,
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Welcome to Wasillah! We're excited to have you on board. 
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Join CSR projects, build your portfolio, and make an impact while learning.
        </p>
        
        <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <p style="margin: 0; color: #1E40AF; font-size: 15px; line-height: 1.6;">
            <strong>💡 Tip for Students:</strong> Complete your profile to get personalized project recommendations.
          </p>
        </div>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
          — The Wasillah Team
        </p>
      </div>
      
      <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">Thank you for joining our community!</p>
      </div>
    </div>
  `;

  const result = await sendTestEmail({
    to: TEST_RECIPIENT,
    subject: '[TEST] Welcome to Wasillah, Test User!',
    html: html
  });

  if (result.success) {
    console.log('✅ Welcome email sent successfully!');
    console.log(`   Email ID: ${result.data?.id || 'N/A'}`);
    testResults.passed++;
  } else {
    console.log('❌ Welcome email failed!');
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
    testResults.failed++;
  }
  
  testResults.tests.push({
    name: 'Welcome Email',
    success: result.success,
    error: JSON.stringify(result.error)
  });
}

/**
 * Test 2: Submission Confirmation Email
 */
async function testSubmissionConfirmation() {
  console.log('\n📧 Test 2: Submission Confirmation Email');
  console.log('━'.repeat(60));
  
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
      <div style="background: ${brand.gradient}; padding: 30px 20px; text-align: center;">
        <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">Submission Received</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px 24px;">
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Hi <strong>Test User</strong>,
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Your submission for "<strong>Test CSR Project</strong>" has been received and is under review.
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          You'll be notified once it's approved.
        </p>
        
        <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; color: #0f172a; font-size: 15px;">
            <strong>Type:</strong> Project
          </p>
          <p style="margin: 8px 0 0; color: #334155; font-size: 15px;">
            <strong>Title:</strong> Test CSR Project
          </p>
          <p style="margin: 8px 0 0; color: #334155; font-size: 15px;">
            <strong>Status:</strong> Under Review
          </p>
        </div>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
          — The Wasillah Team
        </p>
      </div>
      
      <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">We'll review your submission and get back to you soon.</p>
      </div>
    </div>
  `;

  const result = await sendTestEmail({
    to: TEST_RECIPIENT,
    subject: '[TEST] Project Submission Received: Test CSR Project',
    html: html
  });

  if (result.success) {
    console.log('✅ Submission confirmation sent successfully!');
    console.log(`   Email ID: ${result.data?.id || 'N/A'}`);
    testResults.passed++;
  } else {
    console.log('❌ Submission confirmation failed!');
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
    testResults.failed++;
  }
  
  testResults.tests.push({
    name: 'Submission Confirmation',
    success: result.success,
    error: JSON.stringify(result.error)
  });
}

/**
 * Test 3: Approval Email
 */
async function testApprovalEmail() {
  console.log('\n📧 Test 3: Approval Notification Email');
  console.log('━'.repeat(60));
  
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #10B981, #34D399); padding: 30px 20px; text-align: center;">
        <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">🎉 Approved!</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px 24px;">
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Hi <strong>Test User</strong>,
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Great news! Your project "<strong>Test CSR Project</strong>" has been approved.
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Thank you for contributing to Wasillah. Your project is now live and visible to the community!
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
          — The Wasillah Team
        </p>
      </div>
      
      <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">Keep up the great work!</p>
      </div>
    </div>
  `;

  const result = await sendTestEmail({
    to: TEST_RECIPIENT,
    subject: '[TEST] Great News! Your project "Test CSR Project" has been approved',
    html: html
  });

  if (result.success) {
    console.log('✅ Approval email sent successfully!');
    console.log(`   Email ID: ${result.data?.id || 'N/A'}`);
    testResults.passed++;
  } else {
    console.log('❌ Approval email failed!');
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
    testResults.failed++;
  }
  
  testResults.tests.push({
    name: 'Approval Email',
    success: result.success,
    error: JSON.stringify(result.error)
  });
}

/**
 * Test 4: Reminder Email
 */
async function testReminderEmail() {
  console.log('\n📧 Test 4: Reminder Email');
  console.log('━'.repeat(60));
  
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
      <div style="background: ${brand.gradient}; padding: 30px 20px; text-align: center;">
        <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">⏰ Reminder</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px 24px;">
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Hi <strong>Test User</strong>,
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          This is your reminder for <strong>Test CSR Project</strong>:
        </p>
        
        <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <p style="margin: 0; color: #78350F; font-size: 15px; line-height: 1.6;">
            Don't forget to submit your project report by Friday!
          </p>
        </div>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
          — Wasillah Team
        </p>
      </div>
      
      <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">This is an automated reminder you set up.</p>
      </div>
    </div>
  `;

  const result = await sendTestEmail({
    to: TEST_RECIPIENT,
    subject: '[TEST] Reminder: Test CSR Project',
    html: html
  });

  if (result.success) {
    console.log('✅ Reminder email sent successfully!');
    console.log(`   Email ID: ${result.data?.id || 'N/A'}`);
    testResults.passed++;
  } else {
    console.log('❌ Reminder email failed!');
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
    testResults.failed++;
  }
  
  testResults.tests.push({
    name: 'Reminder Email',
    success: result.success,
    error: JSON.stringify(result.error)
  });
}

/**
 * Test 5: Edit Request Email
 */
async function testEditRequestEmail() {
  console.log('\n📧 Test 5: Edit Request Confirmation Email');
  console.log('━'.repeat(60));
  
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
      <div style="background: ${brand.gradient}; padding: 30px 20px; text-align: center;">
        <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">Edit Request Submitted</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px 24px;">
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Hi <strong>Test User</strong>,
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Your edit request for the project "<strong>Test CSR Project</strong>" has been submitted and is under review by our admin team.
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          You will receive an email notification once your changes are reviewed and processed.
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
          — The Wasillah Team
        </p>
      </div>
      
      <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">Thank you for keeping your project information up to date!</p>
      </div>
    </div>
  `;

  const result = await sendTestEmail({
    to: TEST_RECIPIENT,
    subject: '[TEST] Edit Request Received: Test CSR Project',
    html: html
  });

  if (result.success) {
    console.log('✅ Edit request email sent successfully!');
    console.log(`   Email ID: ${result.data?.id || 'N/A'}`);
    testResults.passed++;
  } else {
    console.log('❌ Edit request email failed!');
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
    testResults.failed++;
  }
  
  testResults.tests.push({
    name: 'Edit Request Email',
    success: result.success,
    error: JSON.stringify(result.error)
  });
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '═'.repeat(60));
  console.log('🧪 EMAIL FUNCTIONALITY TEST SUITE');
  console.log('═'.repeat(60));
  console.log(`\n📋 Configuration:`);
  console.log(`   Resend API Key: ${RESEND_API_KEY.substring(0, 10)}...`);
  console.log(`   Sender Email: ${SENDER_EMAIL}`);
  console.log(`   Test Recipient: ${TEST_RECIPIENT}`);
  console.log(`\n⚠️  Note: Change TEST_EMAIL env variable to your email to receive test emails`);
  
  // Run all tests
  await testWelcomeEmail();
  await testSubmissionConfirmation();
  await testApprovalEmail();
  await testReminderEmail();
  await testEditRequestEmail();
  
  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═'.repeat(60));
  console.log(`\n✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Total: ${testResults.tests.length}`);
  console.log(`\n${testResults.failed === 0 ? '🎉' : '⚠️ '} Overall: ${testResults.failed === 0 ? 'ALL TESTS PASSED!' : 'SOME TESTS FAILED'}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(t => !t.success)
      .forEach(t => {
        console.log(`   - ${t.name}: ${t.error}`);
      });
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n💡 Tips:');
  console.log('   - Check your email inbox for test emails');
  console.log('   - Verify the Resend API key is correct');
  console.log('   - Make sure sender email is verified in Resend dashboard');
  console.log('   - Check spam/junk folder if emails not received');
  console.log('\n');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed with error:', error);
  process.exit(1);
});
