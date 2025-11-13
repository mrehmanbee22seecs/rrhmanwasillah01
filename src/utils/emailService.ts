// Email service utility for sending notifications
// In a production environment, this would integrate with your backend API
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const WEBHOOK_URL: string | undefined = (import.meta as any)?.env?.VITE_EMAIL_WEBHOOK_URL;
const WEBHOOK_TOKEN: string | undefined = (import.meta as any)?.env?.VITE_EMAIL_WEBHOOK_TOKEN;

export interface ChatMessage {
  message: string;
  timestamp: string;
  page: string;
  userAgent: string;
}

export interface EventProjectIdea {
  name: string;
  email: string;
  phone: string;
  type: 'event' | 'project';
  title: string;
  description: string;
  location: string;
  expectedParticipants: string;
  budget: string;
  timeline: string;
  timestamp: string;
  page: string;
}

export interface VolunteerApplication {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  city: string;
  occupation: string;
  experience: string;
  skills: string[];
  interests: string[];
  availability: string;
  motivation: string;
  timestamp: string;
}

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
}

export interface EventRegistration {
  name: string;
  email: string;
  phone: string;
  emergencyContact: string;
  dietaryRestrictions: string;
  experience: string;
  eventTitle: string;
  eventDate: string;
  timestamp: string;
}

export interface ProjectApplication {
  name: string;
  email: string;
  phone: string;
  experience: string;
  motivation: string;
  projectTitle: string;
  timestamp: string;
}

export interface SubmissionNotification {
  type: 'project' | 'event';
  title: string;
  submitterName: string;
  submitterEmail: string;
  submissionId: string;
  timestamp: string;
}

export interface SubmissionStatusUpdate {
  type: 'project' | 'event';
  title: string;
  submitterName: string;
  submitterEmail: string;
  status: 'approved' | 'rejected';
  adminComments?: string;
  rejectionReason?: string;
  timestamp: string;
}

const ADMIN_EMAIL = 'muneebtahir08@gmail.com';

// Common branding tokens
const brand = {
  gradient: 'linear-gradient(135deg, #FF6B9D, #00D9FF)',
  headerBg: '#0F0F23',
  accent: '#FF6B9D',
  textDark: '#2C3E50'
};

// Format chat message email
export const formatChatMessageEmail = (data: ChatMessage): EmailData => {
  return {
    to: ADMIN_EMAIL,
    subject: `New Chat Message from Wasilah Website`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #E67E22, #F39C12); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Chat Message</h1>
          <p style="color: white; margin: 5px 0;">Wasilah Website</p>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #2C3E50; margin-bottom: 20px;">Message Details</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #E67E22; margin-top: 0;">User Message:</h3>
            <p style="background: #f1f2f6; padding: 10px; border-radius: 5px; font-style: italic;">
              "${data.message}"
            </p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <h3 style="color: #E67E22; margin-top: 0;">Additional Information:</h3>
            <p><strong>Page:</strong> ${data.page}</p>
            <p><strong>Timestamp:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
            <p><strong>User Agent:</strong> ${data.userAgent}</p>
          </div>
        </div>
        
        <div style="background: #2C3E50; color: white; padding: 15px; text-align: center;">
          <p style="margin: 0;">This message was sent from the Wasilah website chat widget.</p>
        </div>
      </div>
    `,
    text: `New Chat Message from Wasilah Website\n\nMessage: ${data.message}\nPage: ${data.page}\nTimestamp: ${new Date(data.timestamp).toLocaleString()}`
  };
};

// Format event/project idea email
export const formatEventProjectIdeaEmail = (data: EventProjectIdea): EmailData => {
  return {
    to: ADMIN_EMAIL,
    subject: `New ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Idea: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #E67E22, #F39C12); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Idea</h1>
          <p style="color: white; margin: 5px 0;">Wasilah Website</p>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #2C3E50; margin-bottom: 20px;">${data.title}</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #E67E22; margin-top: 0;">Contact Information:</h3>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #E67E22; margin-top: 0;">${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Details:</h3>
            <p><strong>Type:</strong> ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}</p>
            <p><strong>Title:</strong> ${data.title}</p>
            <p><strong>Description:</strong></p>
            <p style="background: #f1f2f6; padding: 10px; border-radius: 5px;">${data.description}</p>
            <p><strong>Location:</strong> ${data.location || 'Not specified'}</p>
            <p><strong>Expected Participants:</strong> ${data.expectedParticipants || 'Not specified'}</p>
            <p><strong>Budget:</strong> ${data.budget || 'Not specified'}</p>
            <p><strong>Timeline:</strong> ${data.timeline || 'Not specified'}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <h3 style="color: #E67E22; margin-top: 0;">Submission Details:</h3>
            <p><strong>Submitted from:</strong> ${data.page}</p>
            <p><strong>Timestamp:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
          </div>
        </div>
        
        <div style="background: #2C3E50; color: white; padding: 15px; text-align: center;">
          <p style="margin: 0;">This idea was submitted through the Wasilah website chat widget.</p>
        </div>
      </div>
    `,
    text: `New ${data.type} Idea: ${data.title}\n\nFrom: ${data.name} (${data.email})\nDescription: ${data.description}\nSubmitted: ${new Date(data.timestamp).toLocaleString()}`
  };
};

// Format volunteer application email
export const formatVolunteerApplicationEmail = (data: VolunteerApplication): EmailData => {
  return {
    to: ADMIN_EMAIL,
    subject: `New Volunteer Application: ${data.firstName} ${data.lastName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #E67E22, #F39C12); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Volunteer Application</h1>
          <p style="color: white; margin: 5px 0;">Wasilah Website</p>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #2C3E50; margin-bottom: 20px;">${data.firstName} ${data.lastName}</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #E67E22; margin-top: 0;">Personal Information:</h3>
            <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Age:</strong> ${data.age || 'Not provided'}</p>
            <p><strong>City:</strong> ${data.city}</p>
            <p><strong>Occupation:</strong> ${data.occupation || 'Not provided'}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #E67E22; margin-top: 0;">Skills & Interests:</h3>
            <p><strong>Skills:</strong> ${data.skills.length > 0 ? data.skills.join(', ') : 'None specified'}</p>
            <p><strong>Areas of Interest:</strong> ${data.interests.length > 0 ? data.interests.join(', ') : 'None specified'}</p>
            <p><strong>Availability:</strong> ${data.availability}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #E67E22; margin-top: 0;">Experience & Motivation:</h3>
            <p><strong>Previous Experience:</strong></p>
            <p style="background: #f1f2f6; padding: 10px; border-radius: 5px;">${data.experience || 'No previous experience mentioned'}</p>
            <p><strong>Motivation:</strong></p>
            <p style="background: #f1f2f6; padding: 10px; border-radius: 5px;">${data.motivation || 'No motivation statement provided'}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <h3 style="color: #E67E22; margin-top: 0;">Application Details:</h3>
            <p><strong>Submitted:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
          </div>
        </div>
        
        <div style="background: #2C3E50; color: white; padding: 15px; text-align: center;">
          <p style="margin: 0;">This application was submitted through the Wasilah volunteer registration form.</p>
        </div>
      </div>
    `,
    text: `New Volunteer Application from ${data.firstName} ${data.lastName}\n\nEmail: ${data.email}\nPhone: ${data.phone}\nCity: ${data.city}\nAvailability: ${data.availability}\nSubmitted: ${new Date(data.timestamp).toLocaleString()}`
  };
};

// Format contact message email
export const formatContactMessageEmail = (data: ContactMessage): EmailData => {
  return {
    to: ADMIN_EMAIL,
    subject: `Contact Form: ${data.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #E67E22, #F39C12); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Contact Message</h1>
          <p style="color: white; margin: 5px 0;">Wasilah Website</p>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #2C3E50; margin-bottom: 20px;">${data.subject}</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #E67E22; margin-top: 0;">Contact Information:</h3>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #E67E22; margin-top: 0;">Message:</h3>
            <p style="background: #f1f2f6; padding: 15px; border-radius: 5px; line-height: 1.6;">${data.message}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <h3 style="color: #E67E22; margin-top: 0;">Message Details:</h3>
            <p><strong>Submitted:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
          </div>
        </div>
        
        <div style="background: #2C3E50; color: white; padding: 15px; text-align: center;">
          <p style="margin: 0;">This message was sent through the Wasilah contact form.</p>
        </div>
      </div>
    `,
    text: `Contact Form Message: ${data.subject}\n\nFrom: ${data.name} (${data.email})\nMessage: ${data.message}\nSubmitted: ${new Date(data.timestamp).toLocaleString()}`
  };
};

// Format event registration email
export const formatEventRegistrationEmail = (data: EventRegistration): EmailData => {
  return {
    to: ADMIN_EMAIL,
    subject: `Event Registration: ${data.eventTitle} - ${data.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #E67E22, #F39C12); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Event Registration</h1>
          <p style="color: white; margin: 5px 0;">Wasilah Website</p>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #2C3E50; margin-bottom: 20px;">${data.eventTitle}</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #E67E22; margin-top: 0;">Participant Information:</h3>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Emergency Contact:</strong> ${data.emergencyContact || 'Not provided'}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #E67E22; margin-top: 0;">Additional Information:</h3>
            <p><strong>Dietary Restrictions:</strong> ${data.dietaryRestrictions || 'None'}</p>
            <p><strong>Previous Experience:</strong></p>
            <p style="background: #f1f2f6; padding: 10px; border-radius: 5px;">${data.experience || 'No previous experience mentioned'}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <h3 style="color: #E67E22; margin-top: 0;">Registration Details:</h3>
            <p><strong>Event:</strong> ${data.eventTitle}</p>
            <p><strong>Event Date:</strong> ${data.eventDate}</p>
            <p><strong>Registered:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
          </div>
        </div>
        
        <div style="background: #2C3E50; color: white; padding: 15px; text-align: center;">
          <p style="margin: 0;">This registration was submitted through the Wasilah event registration form.</p>
        </div>
      </div>
    `,
    text: `Event Registration: ${data.eventTitle}\n\nParticipant: ${data.name} (${data.email})\nPhone: ${data.phone}\nEvent Date: ${data.eventDate}\nRegistered: ${new Date(data.timestamp).toLocaleString()}`
  };
};

// Format project application email
export const formatProjectApplicationEmail = (data: ProjectApplication): EmailData => {
  return {
    to: ADMIN_EMAIL,
    subject: `Project Application: ${data.projectTitle} - ${data.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #E67E22, #F39C12); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Project Application</h1>
          <p style="color: white; margin: 5px 0;">Wasilah Website</p>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #2C3E50; margin-bottom: 20px;">${data.projectTitle}</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #E67E22; margin-top: 0;">Applicant Information:</h3>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #E67E22; margin-top: 0;">Experience & Motivation:</h3>
            <p><strong>Relevant Experience:</strong></p>
            <p style="background: #f1f2f6; padding: 10px; border-radius: 5px;">${data.experience || 'No experience mentioned'}</p>
            <p><strong>Motivation:</strong></p>
            <p style="background: #f1f2f6; padding: 10px; border-radius: 5px;">${data.motivation || 'No motivation statement provided'}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <h3 style="color: #E67E22; margin-top: 0;">Application Details:</h3>
            <p><strong>Project:</strong> ${data.projectTitle}</p>
            <p><strong>Applied:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
          </div>
        </div>
        
        <div style="background: #2C3E50; color: white; padding: 15px; text-align: center;">
          <p style="margin: 0;">This application was submitted through the Wasilah project application form.</p>
        </div>
      </div>
    `,
    text: `Project Application: ${data.projectTitle}\n\nApplicant: ${data.name} (${data.email})\nPhone: ${data.phone}\nApplied: ${new Date(data.timestamp).toLocaleString()}`
  };
};

// Format submission notification email (to admin)
export const formatSubmissionNotificationEmail = (data: SubmissionNotification): EmailData => {
  return {
    to: ADMIN_EMAIL,
    subject: `New ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Submission: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #E67E22, #F39C12); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Submission</h1>
          <p style="color: white; margin: 5px 0;">Wasilah Admin Panel</p>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #2C3E50; margin-bottom: 20px;">${data.title}</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #E67E22; margin-top: 0;">Submission Details:</h3>
            <p><strong>Type:</strong> ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}</p>
            <p><strong>Title:</strong> ${data.title}</p>
            <p><strong>Submitted by:</strong> ${data.submitterName}</p>
            <p><strong>Email:</strong> ${data.submitterEmail}</p>
            <p><strong>Submission ID:</strong> ${data.submissionId}</p>
            <p><strong>Status:</strong> Pending Review</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <h3 style="color: #E67E22; margin-top: 0;">Next Steps:</h3>
            <p>Please review this submission in the admin panel and approve or reject it.</p>
            <p><strong>Submitted:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
          </div>
        </div>
        
        <div style="background: #2C3E50; color: white; padding: 15px; text-align: center;">
          <p style="margin: 0;">This submission is awaiting your review in the Wasilah admin panel.</p>
        </div>
      </div>
    `,
    text: `New ${data.type} Submission: ${data.title}\n\nSubmitted by: ${data.submitterName} (${data.submitterEmail})\nSubmission ID: ${data.submissionId}\nSubmitted: ${new Date(data.timestamp).toLocaleString()}\n\nPlease review this submission in the admin panel.`
  };
};

// Format submission status update email (to user)
export const formatSubmissionStatusUpdateEmail = (data: SubmissionStatusUpdate): EmailData => {
  const isApproved = data.status === 'approved';
  
  return {
    to: data.submitterEmail,
    subject: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Submission ${isApproved ? 'Approved' : 'Rejected'}: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${isApproved ? '#10B981, #34D399' : '#EF4444, #F87171'}); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Submission ${isApproved ? 'Approved' : 'Rejected'}</h1>
          <p style="color: white; margin: 5px 0;">Wasilah Community Platform</p>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #2C3E50; margin-bottom: 20px;">Hello ${data.submitterName},</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: ${isApproved ? '#10B981' : '#EF4444'}; margin-top: 0;">
              ${isApproved ? '🎉 Great News!' : '📝 Update Required'}
            </h3>
            <p>Your ${data.type} submission "<strong>${data.title}</strong>" has been <strong>${data.status}</strong>.</p>
            
            ${isApproved ? `
              <p>Congratulations! Your ${data.type} is now live on our platform and visible to the community.</p>
            ` : `
              <p>We've reviewed your submission and it needs some adjustments before it can be approved.</p>
              ${data.rejectionReason ? `<p><strong>Reason:</strong> ${data.rejectionReason}</p>` : ''}
            `}
          </div>
          
          ${data.adminComments ? `
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h3 style="color: #E67E22; margin-top: 0;">Admin Comments:</h3>
              <p style="background: #f1f2f6; padding: 10px; border-radius: 5px;">${data.adminComments}</p>
            </div>
          ` : ''}
          
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <h3 style="color: #E67E22; margin-top: 0;">What's Next?</h3>
            ${isApproved ? `
              <p>Your ${data.type} is now visible to the community. You can view it on our website and track its progress through your dashboard.</p>
            ` : `
              <p>You can edit your submission and resubmit it for review. Please address the feedback provided and try again.</p>
            `}
            <p>Visit your dashboard to see all your submissions and their current status.</p>
          </div>
        </div>
        
        <div style="background: #2C3E50; color: white; padding: 15px; text-align: center;">
          <p style="margin: 0;">Thank you for contributing to the Wasilah community!</p>
        </div>
      </div>
    `,
    text: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Submission ${isApproved ? 'Approved' : 'Rejected'}: ${data.title}\n\nHello ${data.submitterName},\n\nYour ${data.type} "${data.title}" has been ${data.status}.\n\n${isApproved ? 'Congratulations! Your submission is now live.' : 'Please review the feedback and resubmit.'}\n\n${data.adminComments ? `Admin Comments: ${data.adminComments}\n\n` : ''}${data.rejectionReason ? `Reason: ${data.rejectionReason}\n\n` : ''}Updated: ${new Date(data.timestamp).toLocaleString()}`
  };
};

// Submission received (to user)
export const formatSubmissionReceivedEmail = (data: {
  type: 'project' | 'event';
  title: string;
  submitterName: string;
  submitterEmail: string;
  summary?: string;
  when?: string; // date/time or start-end dates
}): EmailData => {
  const niceType = data.type.charAt(0).toUpperCase() + data.type.slice(1);
  return {
    to: data.submitterEmail,
    subject: `${niceType} submitted successfully: ${data.title}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background:#f8fafc">
        <div style="background: ${brand.gradient}; padding: 20px; text-align:center;">
          <h1 style="color:#fff; margin:0;">${niceType} Received</h1>
        </div>
        <div style="background:#fff; padding:24px;">
          <p style="color:${brand.textDark}">Hello <strong>${data.submitterName}</strong>,</p>
          <p style="color:${brand.textDark}">Thank you for your ${data.type} submission. Our team will review it shortly.</p>
          <div style="background:#f1f5f9; border-radius:12px; padding:16px; margin:16px 0;">
            <p style="margin:0; color:#0f172a"><strong>Title:</strong> ${data.title}</p>
            ${data.summary ? `<p style="margin:8px 0 0; color:#334155"><strong>Summary:</strong> ${data.summary}</p>` : ''}
            ${data.when ? `<p style="margin:8px 0 0; color:#334155"><strong>When:</strong> ${data.when}</p>` : ''}
          </div>
          <p style="color:${brand.textDark}">We will notify you as soon as there is an update.</p>
          <p style="color:${brand.textDark}">— Wasilah Team</p>
        </div>
      </div>
    `
  };
};

// Event registration confirmation (to user)
export const formatEventRegistrationConfirmationEmail = (data: {
  name: string;
  email: string;
  eventTitle: string;
  eventDate: string;
  time?: string;
  location?: string;
}): EmailData => {
  return {
    to: data.email,
    subject: `You're registered: ${data.eventTitle}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background:#f8fafc">
        <div style="background: ${brand.gradient}; padding: 20px; text-align:center;">
          <h1 style="color:#fff; margin:0;">Registration Confirmed</h1>
        </div>
        <div style="background:#fff; padding:24px;">
          <p style="color:${brand.textDark}">Hello <strong>${data.name}</strong>,</p>
          <p style="color:${brand.textDark}">You're registered for <strong>${data.eventTitle}</strong>.</p>
          <div style="background:#f1f5f9; border-radius:12px; padding:16px; margin:16px 0;">
            <p style="margin:0; color:#0f172a"><strong>Date:</strong> ${data.eventDate}</p>
            ${data.time ? `<p style=\"margin:8px 0 0; color:#334155\"><strong>Time:</strong> ${data.time}</p>` : ''}
            ${data.location ? `<p style=\"margin:8px 0 0; color:#334155\"><strong>Location:</strong> ${data.location}</p>` : ''}
          </div>
          <p style="color:${brand.textDark}">We look forward to seeing you!</p>
          <p style="color:${brand.textDark}">— Wasilah Team</p>
        </div>
      </div>
    `
  };
};

// Project application confirmation (to user)
export const formatProjectApplicationConfirmationEmail = (data: {
  name: string;
  email: string;
  projectTitle: string;
}): EmailData => {
  return {
    to: data.email,
    subject: `Application received: ${data.projectTitle}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background:#f8fafc">
        <div style="background: ${brand.gradient}; padding: 20px; text-align:center;">
          <h1 style="color:#fff; margin:0;">Application Received</h1>
        </div>
        <div style="background:#fff; padding:24px;">
          <p style="color:${brand.textDark}">Hello <strong>${data.name}</strong>,</p>
          <p style="color:${brand.textDark}">Thank you for applying to <strong>${data.projectTitle}</strong>. Our team will review your application and get back to you.</p>
          <p style="color:${brand.textDark}">— Wasilah Team</p>
        </div>
      </div>
    `
  };
};

// Reminder email (to user)
export const formatReminderEmail = (data: {
  to: string;
  title: string;
  description?: string;
  when: string;
  submissionTitle?: string;
  submissionType?: 'project' | 'event';
}): EmailData => {
  return {
    to: data.to,
    subject: `Reminder: ${data.title}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background:#f8fafc">
        <div style="background: ${brand.gradient}; padding: 20px; text-align:center;">
          <h1 style="color:#fff; margin:0;">Reminder</h1>
        </div>
        <div style="background:#fff; padding:24px;">
          ${data.submissionTitle ? `<p style=\"color:${brand.textDark}\">For: <strong>${data.submissionTitle}</strong>${data.submissionType ? ` (${data.submissionType})` : ''}</p>` : ''}
          <p style="color:${brand.textDark}"><strong>${data.title}</strong></p>
          <p style="color:${brand.textDark}">When: ${data.when}</p>
          ${data.description ? `<p style=\"color:${brand.textDark}\">${data.description}</p>` : ''}
          <p style="color:${brand.textDark}">— Wasilah Team</p>
        </div>
      </div>
    `
  };
};

// Store response in Firebase
const storeResponse = async (type: string, data: any) => {
  try {
    const collectionName = type + 's'; // volunteers, contacts, chats, events, projects
    await addDoc(collection(db, collectionName), {
      ...data,
      timestamp: serverTimestamp(),
      status: 'new'
    });
    console.log(`${type} response stored in Firebase`);
  } catch (error) {
    console.error(`Error storing ${type} response:`, error);
  }
};

// Main email sending function (to be implemented with your backend)
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // If webhook is configured (Apps Script or any HTTPS email relay), use it
    if (WEBHOOK_URL) {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'send',
          token: WEBHOOK_TOKEN || '',
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text || undefined,
        }),
      });
      if (!res.ok) {
        console.warn('Email webhook responded with non-2xx');
      }
    }

    // Store in Firebase based on email subject/type
    // Note: Disabled automatic email logging to prevent permission errors
    // Email records are stored in their respective collections (e.g., project_submissions, event_submissions)
    // through the submission forms and other specific workflows
    /*
    const emailType = emailData.subject.toLowerCase();
    if (emailType.includes('volunteer')) {
      await storeResponse('volunteer', { email: emailData.to, subject: emailData.subject, content: emailData.html });
    } else if (emailType.includes('contact')) {
      await storeResponse('contact', { email: emailData.to, subject: emailData.subject, content: emailData.html });
    } else if (emailType.includes('chat')) {
      await storeResponse('chat', { email: emailData.to, subject: emailData.subject, content: emailData.html });
    } else if (emailType.includes('event')) {
      await storeResponse('event', { email: emailData.to, subject: emailData.subject, content: emailData.html });
    } else if (emailType.includes('project')) {
      await storeResponse('project', { email: emailData.to, subject: emailData.subject, content: emailData.html });
    } else if (emailType.includes('submission')) {
      await storeResponse('submission', { email: emailData.to, subject: emailData.subject, content: emailData.html });
    }
    */

    // In a real application, this would call your backend API
    // For now, also log the email data for visibility
    console.log('Sending email to:', emailData.to);
    console.log('Subject:', emailData.subject);
    console.log('HTML Content:', emailData.html);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Spark-friendly reminder scheduler via webhook (Apps Script or any HTTPS endpoint)
export const scheduleReminderEmails = async (params: {
  recipients: string[];
  subject: string;
  html: string;
  sendAtISO: string; // ISO datetime string
}): Promise<boolean> => {
  try {
    if (!WEBHOOK_URL) {
      console.warn('No WEBHOOK_URL configured; skipping scheduleReminderEmails');
      return false;
    }
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'schedule',
        token: WEBHOOK_TOKEN || '',
        to: params.recipients,
        subject: params.subject,
        html: params.html,
        sendAt: params.sendAtISO,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error('scheduleReminderEmails failed', e);
    return false;
  }
};