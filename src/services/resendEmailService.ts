/**
 * Resend Email Service for Wasillah Email Automation
 * 
 * This service handles all transactional emails using Resend API:
 * 1. Welcome emails on user signup
 * 2. Submission confirmations (projects/events)
 * 3. Admin approval notifications
 * 4. Volunteer form confirmations
 * 5. Custom reminders
 */

import { Resend } from 'resend';

// Initialize Resend client
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY || 're_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Sender email configuration
const SENDER_EMAIL = import.meta.env.VITE_RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
const SENDER_NAME = 'Wasillah Team';

// Brand styling
const brand = {
  gradient: 'linear-gradient(135deg, #FF6B9D, #00D9FF)',
  headerBg: '#0F0F23',
  accent: '#FF6B9D',
  textDark: '#2C3E50',
  textLight: '#ffffff'
};

/**
 * Helper function to send email via Resend
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    console.error('Resend API key not configured');
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Failed to send email via Resend:', error);
      return false;
    }

    console.log('Email sent via Resend:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send email via Resend:', error);
    return false;
  }
}

/**
 * 1. Welcome Email - Sent on user signup (Role-specific)
 */
export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  role?: 'student' | 'ngo' | 'volunteer' | 'admin';
}): Promise<boolean> {
  const role = params.role || 'volunteer';
  
  // Role-specific welcome messages
  const roleMessages: Record<string, { title: string; message: string; cta: string; ctaLink: string }> = {
    student: {
      title: 'Welcome, Student!',
      message: 'Join CSR projects, build your portfolio, and make an impact while learning. Explore opportunities that match your interests and skills.',
      cta: 'Browse CSR Projects',
      ctaLink: '/projects'
    },
    ngo: {
      title: 'Welcome, NGO Partner!',
      message: 'Post projects, manage volunteers, and track your organization\'s impact. Start creating your first project and connect with passionate volunteers.',
      cta: 'Create Your First Project',
      ctaLink: '/create-submission?type=project'
    },
    volunteer: {
      title: 'Welcome, Volunteer!',
      message: 'Find volunteer opportunities, join projects, and make a difference in your community. Start your journey of impact today.',
      cta: 'Explore Opportunities',
      ctaLink: '/projects'
    },
    admin: {
      title: 'Welcome, Admin!',
      message: 'Manage the platform, moderate content, and ensure quality. Access the admin panel to get started.',
      cta: 'Go to Admin Panel',
      ctaLink: '/dashboard'
    }
  };

  const roleContent = roleMessages[role] || roleMessages['volunteer'];

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
      <div style="background: ${brand.gradient}; padding: 30px 20px; text-align: center;">
        <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">${roleContent.title}</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px 24px;">
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Hi <strong>${params.name}</strong>,
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Welcome to Wasillah! We're excited to have you on board. 
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          ${roleContent.message}
        </p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${window.location.origin}${roleContent.ctaLink}" 
             style="display: inline-block; background: ${brand.accent}; color: ${brand.textLight}; 
                    padding: 14px 28px; border-radius: 8px; text-decoration: none; 
                    font-weight: 600; font-size: 16px;">
            ${roleContent.cta}
          </a>
        </div>

        ${role === 'student' ? `
        <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <p style="margin: 0; color: #1E40AF; font-size: 15px; line-height: 1.6;">
            <strong>💡 Tip for Students:</strong> Complete your profile to get personalized project recommendations based on your skills and interests.
          </p>
        </div>
        ` : ''}

        ${role === 'ngo' ? `
        <div style="background: #ECFDF5; border-left: 4px solid #10B981; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <p style="margin: 0; color: #065F46; font-size: 15px; line-height: 1.6;">
            <strong>💡 Tip for NGOs:</strong> Complete your organization profile to build trust with volunteers and increase project visibility.
          </p>
        </div>
        ` : ''}
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
          — The Wasillah Team
        </p>
      </div>
      
      <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">Thank you for joining our community!</p>
      </div>
    </div>
  `;

  return sendEmail(params.email, `Welcome to Wasillah, ${params.name}!`, html);
}

/**
 * 2. Submission Confirmation - Projects or Events
 */
export async function sendSubmissionConfirmation(params: {
  email: string;
  name: string;
  projectName: string;
  type: 'project' | 'event';
}): Promise<boolean> {
  const typeLabel = params.type === 'project' ? 'Project' : 'Event';

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
      <div style="background: ${brand.gradient}; padding: 30px 20px; text-align: center;">
        <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">Submission Received</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px 24px;">
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Hi <strong>${params.name}</strong>,
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Your submission for "<strong>${params.projectName}</strong>" has been received and is under review.
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          You'll be notified once it's approved.
        </p>
        
        <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; color: #0f172a; font-size: 15px;">
            <strong>Type:</strong> ${typeLabel}
          </p>
          <p style="margin: 8px 0 0; color: #334155; font-size: 15px;">
            <strong>Title:</strong> ${params.projectName}
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

  return sendEmail(params.email, `${typeLabel} Submission Received: ${params.projectName}`, html);
}

/**
 * 3. Admin Approval - Project or Event Accepted
 */
export async function sendApprovalEmail(params: {
  email: string;
  name: string;
  projectName: string;
  type: 'project' | 'event';
}): Promise<boolean> {
  const typeLabel = params.type === 'project' ? 'project' : 'event';

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #10B981, #34D399); padding: 30px 20px; text-align: center;">
        <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">🎉 Approved!</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px 24px;">
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Hi <strong>${params.name}</strong>,
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Great news! Your ${typeLabel} "<strong>${params.projectName}</strong>" has been approved.
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Thank you for contributing to Wasillah. Your ${typeLabel} is now live and visible to the community!
        </p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${window.location.origin}/dashboard" 
             style="display: inline-block; background: #10B981; color: ${brand.textLight}; 
                    padding: 14px 28px; border-radius: 8px; text-decoration: none; 
                    font-weight: 600; font-size: 16px;">
            View Dashboard
          </a>
        </div>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
          — The Wasillah Team
        </p>
      </div>
      
      <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">Keep up the great work!</p>
      </div>
    </div>
  `;

  return sendEmail(params.email, `Great News! Your ${typeLabel} "${params.projectName}" has been approved`, html);
}

/**
 * 4. Custom Reminder Email
 */
export async function sendReminderEmail(params: {
  email: string;
  name: string;
  projectName: string;
  message: string;
}): Promise<boolean> {
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
      <div style="background: ${brand.gradient}; padding: 30px 20px; text-align: center;">
        <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">⏰ Reminder</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px 24px;">
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Hi <strong>${params.name}</strong>,
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          This is your reminder for <strong>${params.projectName}</strong>:
        </p>
        
        <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <p style="margin: 0; color: #78350F; font-size: 15px; line-height: 1.6;">
            ${params.message}
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

  return sendEmail(params.email, `Reminder: ${params.projectName}`, html);
}

/**
 * 5. Volunteer Form Confirmation
 */
export async function sendVolunteerConfirmation(params: {
  email: string;
  name: string;
}): Promise<boolean> {
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
      <div style="background: ${brand.gradient}; padding: 30px 20px; text-align: center;">
        <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">💌 Thank You!</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px 24px;">
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Hi <strong>${params.name}</strong>,
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Thank you for volunteering with Wasillah!
        </p>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
          Your response has been recorded and we'll get back to you very soon.
        </p>
        
        <div style="background: #DBEAFE; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; color: #1E40AF; font-size: 15px; line-height: 1.6;">
            <strong>What's Next?</strong><br>
            Our team will review your application and reach out to you with more details about volunteer opportunities that match your interests and availability.
          </p>
        </div>
        
        <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
          — The Wasillah Team
        </p>
      </div>
      
      <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">We appreciate your willingness to make a difference!</p>
      </div>
    </div>
  `;

  return sendEmail(params.email, 'Thank You for Volunteering with Wasillah!', html);
}

/**
 * Check if Resend is properly configured
 */
export function isResendConfigured(): boolean {
  return !!resend;
}

export default {
  sendWelcomeEmail,
  sendSubmissionConfirmation,
  sendApprovalEmail,
  sendReminderEmail,
  sendVolunteerConfirmation,
  isResendConfigured
};
