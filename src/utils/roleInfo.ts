/**
 * Role Information and Configuration
 * Defines role details, icons, and features for each user type
 */

import { RoleInfo, UserRole } from '../types/user';
import { GraduationCap, Users, Heart, Shield } from 'lucide-react';

export const ROLE_INFO: Record<UserRole, RoleInfo> = {
  student: {
    id: 'student',
    name: 'Student',
    description: 'Join CSR projects, build your portfolio, and make an impact while learning',
    icon: 'GraduationCap',
    features: [
      'Join CSR projects',
      'Track volunteer hours',
      'Get certificates',
      'Build your portfolio',
      'Connect with NGOs',
      'Skill development opportunities'
    ],
    color: 'bg-blue-500'
  },
  ngo: {
    id: 'ngo',
    name: 'NGO',
    description: 'Post projects, manage volunteers, and track your organization\'s impact',
    icon: 'Users',
    features: [
      'Post projects and events',
      'Manage volunteers',
      'Track impact',
      'Receive donations',
      'Build your organization profile',
      'Analytics dashboard'
    ],
    color: 'bg-green-500'
  },
  volunteer: {
    id: 'volunteer',
    name: 'Volunteer',
    description: 'Find volunteer opportunities, join projects, and make a difference in your community',
    icon: 'Heart',
    features: [
      'Find volunteer opportunities',
      'Join projects and events',
      'Track your impact',
      'Earn badges and points',
      'Connect with community',
      'Skill matching'
    ],
    color: 'bg-red-500'
  },
  admin: {
    id: 'admin',
    name: 'Admin',
    description: 'Manage the platform, moderate content, and ensure quality',
    icon: 'Shield',
    features: [
      'Platform management',
      'Content moderation',
      'User management',
      'Analytics access',
      'System settings',
      'Full platform access'
    ],
    color: 'bg-purple-500'
  }
};

export const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'student':
      return GraduationCap;
    case 'ngo':
      return Users;
    case 'volunteer':
      return Heart;
    case 'admin':
      return Shield;
    default:
      return Heart;
  }
};

export const getRoleColor = (role: UserRole): string => {
  return ROLE_INFO[role].color;
};

export const getRoleName = (role: UserRole): string => {
  return ROLE_INFO[role].name;
};

