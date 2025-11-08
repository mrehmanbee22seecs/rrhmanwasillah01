export interface HeadInfo {
  id: string;
  name: string;
  designation: string;
  image?: string;
}

export interface ProjectSubmission {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  startDate: string;
  endDate: string;
  expectedVolunteers: number;
  requirements: string[];
  objectives: string[];
  targetAudience?: string;
  durationEstimate?: string;
  durationHours?: number; // Actual duration in hours
  resourceRequirements?: string[];
  skillRequirements?: string[];
  notes?: string;
  checklist?: ChecklistItem[];
  reminders?: Reminder[];
  contactEmail: string;
  contactPhone: string;
  capacity?: number; // Max volunteers
  perks?: string[]; // Certifications/perks
  materialsList?: string[]; // What volunteers should bring
  safetyNotes?: string; // Safety and conduct
  accessibilityInfo?: string; // Accessibility details
  preferredSkills?: string[];
  requiredSkills?: string[];
  roles?: Array<{
    name: string;
    duties: string[];
    minHoursPerWeek?: number;
    capacity?: number;
  }>;
  sponsors?: string[];
  donationLink?: string;
  faq?: Array<{ question: string; answer: string }>;
  affiliation?: {
    type: string; // NGO, University Club, Company, Other
    customType?: string;
    name: string;
  };
  peopleImpacted?: number;
  budget?: string;
  timeline: string;
  submittedBy: string;
  submitterName: string;
  submitterEmail: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  isVisible?: boolean;
  submittedAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  adminComments?: string;
  rejectionReason?: string;
  image?: string;
  heads?: HeadInfo[];
  auditTrail: AuditEntry[];
  completedAt?: any; // When the user completed participation
  participantIds?: string[]; // Users who joined/participated
}

export interface EventSubmission {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  expectedAttendees: number;
  registrationDeadline: string;
  requirements: string[];
  agenda: string[];
  targetAudience?: string;
  durationEstimate?: string;
  durationHours?: number; // Actual duration in hours
  resourceRequirements?: string[];
  skillRequirements?: string[];
  notes?: string;
  checklist?: ChecklistItem[];
  reminders?: Reminder[];
  contactEmail: string;
  contactPhone: string;
  cost: string;
  capacity?: number; // Max attendees
  waitlistEnabled?: boolean;
  servicesIncluded?: string[];
  materialsList?: string[];
  parkingInfo?: string;
  accessibilityInfo?: string;
  childcareAvailable?: boolean;
  certifications?: string[];
  partners?: string[];
  sessions?: Array<{
    title: string;
    start: string; // ISO or time string
    end: string;
    room?: string;
    track?: string;
  }>;
  faq?: Array<{ question: string; answer: string }>;
  projectId?: string; // Link to parent project
  affiliation?: {
    type: string;
    customType?: string;
    name: string;
  };
  peopleImpacted?: number;
  submittedBy: string;
  submitterName: string;
  submitterEmail: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  isVisible?: boolean;
  submittedAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  adminComments?: string;
  rejectionReason?: string;
  image?: string;
  heads?: HeadInfo[];
  auditTrail: AuditEntry[];
  completedAt?: any; // When the user completed attendance
  attendeeIds?: string[]; // Users who registered/attended
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: any;
  completedBy?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminderDate: string;
  reminderTime: string;
  notifyEmails: string[];
  sent: boolean;
  sentAt?: any;
}

export interface AuditEntry {
  action: string;
  performedBy: string;
  performedAt: any;
  details?: string;
  previousStatus?: string;
  newStatus?: string;
}

export type SubmissionType = 'project' | 'event';
export type SubmissionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';

// Structured application/registration entries captured when users apply/register
export interface ProjectApplicationEntry {
  id: string;
  projectId: string;
  projectTitle: string;
  name: string;
  email: string;
  phone: string;
  experience?: string;
  motivation?: string;
  preferredRole?: string;
  availability?: string; // hours/week or time window
  skills?: string[];
  languageProficiency?: string[];
  transportAvailable?: boolean;
  equipment?: string[]; // e.g., laptop, camera
  accessibilityNeeds?: string;
  emergencyContact?: { name: string; phone: string };
  consents?: { liability?: boolean; photo?: boolean; backgroundCheck?: boolean };
  // New UI/UX data
  startAvailabilityDate?: string;
  endAvailabilityDate?: string;
  preferredContactMethod?: string;
  portfolioUrls?: string[];
  heardAboutUs?: string;
  emergencyContactRelation?: string;
  whatsappConsent?: boolean;
  submittedAt: any;
}

export interface EventRegistrationEntry {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  name: string;
  email: string;
  phone: string;
  emergencyContact?: string;
  dietaryRestrictions?: string;
  experience?: string;
  shiftPreference?: string;
  sessionSelections?: string[];
  teamPreference?: string;
  tShirtSize?: string;
  accessibilityNeeds?: string;
  consents?: { liability?: boolean; photo?: boolean };
  // New UI/UX data
  preferredContactMethod?: string;
  heardAboutUs?: string;
  medicalConditions?: string;
  whatsappConsent?: boolean;
  submittedAt: any;
}

export interface VolunteerApplicationEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age?: string;
  city: string;
  occupation?: string;
  experience?: string;
  skills: string[];
  interests: string[];
  availability: string;
  motivation?: string;
  preferredRole?: string;
  languages?: string[];
  tShirtSize?: string;
  emergencyContact?: { name: string; phone: string; relation?: string };
  heardAboutUs?: string;
  whatsappConsent?: boolean;
  submittedAt: any;
}

export interface NewsletterSubscriberEntry {
  id: string;
  email: string;
  source?: string; // 'contact' | 'footer' | etc.
  subscribedAt: any;
}

// Edit Request Types
export interface ProjectApplicationEditRequest {
  id: string;
  originalApplicationId: string;
  projectId: string;
  projectTitle: string;
  userEmail: string;
  originalData: ProjectApplicationEntry;
  requestedChanges: Partial<ProjectApplicationEntry>;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface EventRegistrationEditRequest {
  id: string;
  originalRegistrationId: string;
  eventId: string;
  eventTitle: string;
  userEmail: string;
  originalData: EventRegistrationEntry;
  requestedChanges: Partial<EventRegistrationEntry>;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  reviewNotes?: string;
}