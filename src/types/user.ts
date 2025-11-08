/**
 * User Types and Interfaces
 * Defines user roles, profile data, and authentication-related types
 */

export type UserRole = 'student' | 'ngo' | 'volunteer' | 'admin';

export interface UserProfile {
  // Basic Information
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  
  // Role and Permissions
  role: UserRole;
  isAdmin: boolean;
  isGuest: boolean;
  
  // Profile Information
  bio?: string;
  location?: string;
  city?: string;
  province?: string;
  country?: string;
  
  // Skills and Interests
  skills?: string[];
  interests?: string[];
  causes?: string[]; // CSR interests
  languages?: string[];
  
  // Availability
  availability?: {
    daysOfWeek?: string[]; // ['monday', 'tuesday', ...]
    timeSlots?: string[]; // ['morning', 'afternoon', 'evening']
    hoursPerWeek?: number;
    startDate?: string;
    endDate?: string;
  };
  
  // Social Links
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  
  // Profile Settings
  profileVisibility?: 'public' | 'private' | 'organization-only';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  
  // Onboarding
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: any;
  profileCompletionPercentage?: number;
  
  // Timestamps
  createdAt: any;
  lastLogin: any;
  updatedAt?: any;
  
  // Activity
  activityLog: ActivityLog[];
  
  // Preferences
  preferences?: {
    theme?: string;
    language?: 'en' | 'ur';
    timezone?: string;
    currency?: string;
  };
  
  // NGO-specific fields (if role is 'ngo')
  ngoInfo?: {
    organizationName?: string;
    organizationType?: string;
    registrationNumber?: string;
    verified?: boolean;
    verifiedAt?: any;
    verifiedBy?: string;
  };
  
  // Student-specific fields (if role is 'student')
  studentInfo?: {
    institution?: string;
    degree?: string;
    year?: string;
    studentId?: string;
  };
}

export interface ActivityLog {
  id: string;
  action: string;
  page: string;
  timestamp: any;
  details?: any;
}

export interface OnboardingData {
  role: UserRole;
  interests: string[];
  causes: string[];
  skills: string[];
  location: {
    city?: string;
    province?: string;
    country?: string;
  };
  availability: {
    daysOfWeek?: string[];
    timeSlots?: string[];
    hoursPerWeek?: number;
  };
  bio?: string;
  // NGO-specific
  organizationName?: string;
  organizationType?: string;
  // Student-specific
  institution?: string;
  degree?: string;
  year?: string;
}

export interface RoleInfo {
  id: UserRole;
  name: string;
  description: string;
  icon: string;
  features: string[];
  color: string;
}

