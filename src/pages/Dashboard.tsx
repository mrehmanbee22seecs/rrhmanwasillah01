import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { User, Calendar, Target, Heart, TrendingUp, Clock, MapPin, Users, Award, Settings, Bell, BookOpen, Activity, Star, ChevronRight, Filter, Search, Plus, FileText, Eye, CreditCard as Edit3, CheckCircle, Sparkles, Zap, Palette, Mail, RefreshCw, Lock, AlertCircle, GraduationCap, Shield, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ProjectSubmission, EventSubmission, SubmissionStatus } from '../types/submissions';
import RemindersPanel from '../components/RemindersPanel';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useMagneticEffect } from '../hooks/useMagneticEffect';
import { getRoleIcon, getRoleName, ROLE_INFO } from '../utils/roleInfo';
import { UserRole } from '../types/user';
import OnboardingWizard from '../components/OnboardingWizard';
import VolunteerDashboard from './VolunteerDashboard';
import StudentDashboard from './StudentDashboard';
import NGODashboard from './NGODashboard';

interface DashboardActivity {
  id: string;
  action: string;
  page: string;
  timestamp: any;
  details?: any;
}

interface UserStats {
  projectsJoined: number;
  eventsAttended: number;
  hoursVolunteered: number;
  impactScore: number;
}

type SubmissionWithType = (ProjectSubmission | EventSubmission) & {
  submissionType: 'project' | 'event';
};

const Dashboard = () => {
  const { userData, currentUser, updatePassword, resetPassword, resendEmailVerification, calculateProfileCompletion, refreshUserData, userRole } = useAuth();
  const { currentTheme, setTheme, themes } = useTheme();
  
  // Role-based dashboard routing
  // If user has a specific role, render their specialized dashboard
  if (userRole === 'volunteer') {
    return <VolunteerDashboard />;
  }
  
  if (userRole === 'student') {
    return <StudentDashboard />;
  }
  
  if (userRole === 'ngo') {
    return <NGODashboard />;
  }
  
  // Admin and default users continue to the original dashboard below
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [stats, setStats] = useState<UserStats>({
    projectsJoined: 0,
    eventsAttended: 0,
    hoursVolunteered: 0,
    impactScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [submissions, setSubmissions] = useState<SubmissionWithType[]>([]);
  const [drafts, setDrafts] = useState<SubmissionWithType[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

  useEffect(() => {
    if (currentUser && userData) {
      fetchUserActivities();
      const cleanup = setupRealtimeListeners();
      // Calculate profile completion
      const completion = calculateProfileCompletion();
      setProfileCompletion(completion);
      return cleanup;
    }
  }, [currentUser?.uid, userData]); // Re-run when user data changes

  // Recalculate stats whenever submissions change
  useEffect(() => {
    if (currentUser && userData && submissions.length >= 0) {
      calculateUserStats();
    }
  }, [submissions, currentUser?.uid, userData]);

  const setupRealtimeListeners = () => {
    if (!currentUser) return;

    const projectQuery = query(
      collection(db, 'project_submissions'),
      where('submittedBy', '==', currentUser.uid),
      orderBy('submittedAt', 'desc')
    );

    const eventQuery = query(
      collection(db, 'event_submissions'),
      where('submittedBy', '==', currentUser.uid),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribeProjects = onSnapshot(projectQuery, (snapshot) => {
      const projectSubmissions: SubmissionWithType[] = [];
      const projectDrafts: SubmissionWithType[] = [];

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data(), submissionType: 'project' as const };
        if (data.status === 'draft') {
          projectDrafts.push(data as SubmissionWithType);
        } else {
          projectSubmissions.push(data as SubmissionWithType);
        }
      });

      setSubmissions(prev => [...prev.filter(s => s.submissionType !== 'project'), ...projectSubmissions]);
      setDrafts(prev => [...prev.filter(d => d.submissionType !== 'project'), ...projectDrafts]);
    });

    const unsubscribeEvents = onSnapshot(eventQuery, (snapshot) => {
      const eventSubmissions: SubmissionWithType[] = [];
      const eventDrafts: SubmissionWithType[] = [];

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data(), submissionType: 'event' as const };
        if (data.status === 'draft') {
          eventDrafts.push(data as SubmissionWithType);
        } else {
          eventSubmissions.push(data as SubmissionWithType);
        }
      });

      setSubmissions(prev => [...prev.filter(s => s.submissionType !== 'event'), ...eventSubmissions]);
      setDrafts(prev => [...prev.filter(d => d.submissionType !== 'event'), ...eventDrafts]);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeEvents();
    };
  };

  const fetchUserActivities = async () => {
    if (!currentUser) return;
    
    try {
      // Get recent activities from user's activity log
      const activities = userData?.activityLog?.slice(-10) || [];
      setActivities(activities.reverse());
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = () => {
    if (!userData || !currentUser) return;
    
    // Calculate stats based on ACTUAL completed projects/events from submissions
    const userId = currentUser.uid;
    
    // Count approved/completed projects where user participated
    const completedProjects = submissions.filter(sub => 
      sub.submissionType === 'project' && 
      (sub.status === 'approved' || sub.status === 'completed') &&
      (sub.submittedBy === userId || (sub as any).participantIds?.includes(userId))
    );
    
    // Count approved/completed events where user attended
    const completedEvents = submissions.filter(sub => 
      sub.submissionType === 'event' && 
      (sub.status === 'approved' || sub.status === 'completed') &&
      (sub.submittedBy === userId || (sub as any).attendeeIds?.includes(userId))
    );
    
    // Calculate total hours from completed projects and events
    const totalHours = [...completedProjects, ...completedEvents].reduce((sum, sub) => {
      // Get duration in hours (default to 2 hours if not specified)
      const hours = (sub as any).durationHours || 
                    (parseDurationEstimate((sub as any).durationEstimate) || 2);
      return sum + hours;
    }, 0);
    
    // Calculate impact score: 10 points per project, 5 per event, 1 per 2 hours
    const impactScore = 
      (completedProjects.length * 10) + 
      (completedEvents.length * 5) + 
      Math.floor(totalHours / 2);
    
    const calculatedStats = {
      projectsJoined: completedProjects.length,
      eventsAttended: completedEvents.length,
      hoursVolunteered: Math.round(totalHours),
      impactScore: impactScore
    };
    
    setStats(calculatedStats);
  };

  // Helper function to parse duration estimate string to hours
  const parseDurationEstimate = (estimate?: string): number => {
    if (!estimate) return 0;
    
    const lower = estimate.toLowerCase();
    
    // Extract numbers from string
    const numbers = lower.match(/\d+/g);
    if (!numbers || numbers.length === 0) return 0;
    
    const value = parseInt(numbers[0]);
    
    // Convert to hours based on unit
    if (lower.includes('hour') || lower.includes('hr')) {
      return value;
    } else if (lower.includes('day')) {
      return value * 8; // 8 hours per day
    } else if (lower.includes('week')) {
      return value * 40; // 40 hours per week
    } else if (lower.includes('month')) {
      return value * 160; // ~160 hours per month
    } else if (lower.includes('minute') || lower.includes('min')) {
      return value / 60; // Convert minutes to hours
    }
    
    return value; // Default assume hours
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'page_visit': return <Activity className="w-4 h-4" />;
      case 'volunteer_application_submitted': return <Users className="w-4 h-4" />;
      case 'contact_form_submitted': return <Bell className="w-4 h-4" />;
      case 'event_registration': return <Calendar className="w-4 h-4" />;
      case 'project_application': return <Target className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityDescription = (activity: DashboardActivity) => {
    switch (activity.action) {
      case 'page_visit':
        return `Visited ${activity.page}`;
      case 'volunteer_application_submitted':
        return 'Submitted volunteer application';
      case 'contact_form_submitted':
        return 'Sent a contact message';
      case 'event_registration':
        return 'Registered for an event';
      case 'project_application':
        return 'Applied to join a project';
      default:
        return activity.action.replace(/_/g, ' ');
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Role-based quick actions
  const getQuickActions = (role: UserRole | null) => {
    const baseActions = [
      {
        title: 'Find Projects',
        description: 'Discover new volunteer opportunities',
        icon: Target,
        link: '/projects',
        color: 'bg-blue-500'
      },
      {
        title: 'Upcoming Events',
        description: 'Join community events',
        icon: Calendar,
        link: '/events',
        color: 'bg-green-500'
      }
    ];

    if (role === 'student') {
      return [
        ...baseActions,
        {
          title: 'Browse CSR Projects',
          description: 'Find projects that match your skills',
          icon: GraduationCap,
          link: '/projects?type=csr',
          color: 'bg-indigo-500'
        },
        {
          title: 'Build Portfolio',
          description: 'Track your volunteer hours',
          icon: Award,
          link: '/dashboard',
          color: 'bg-purple-500'
        }
      ];
    } else if (role === 'ngo') {
      return [
        ...baseActions,
        {
          title: 'Create Project',
          description: 'Post a new CSR project',
          icon: Plus,
          link: '/create-submission?type=project',
          color: 'bg-green-600'
        },
        {
          title: 'Manage Volunteers',
          description: 'View and manage applications',
          icon: Users,
          link: '/dashboard',
          color: 'bg-blue-600'
        }
      ];
    } else {
      // Volunteer or default
      return [
        ...baseActions,
        {
          title: 'Apply to Volunteer',
          description: 'Start your volunteer journey',
          icon: Heart,
          link: '/volunteer',
          color: 'bg-red-500'
        },
        {
          title: 'Get Support',
          description: 'Contact our team',
          icon: Users,
          link: '/contact',
          color: 'bg-purple-500'
        }
      ];
    }
  };

  const quickActions = getQuickActions(userRole);

  const upcomingEvents = [
    {
      id: 1,
      title: 'Community Health Fair',
      date: '2024-04-15',
      time: '9:00 AM',
      location: 'Central Community Center',
      participants: 150
    },
    {
      id: 2,
      title: 'Educational Workshop Series',
      date: '2024-04-20',
      time: '2:00 PM',
      location: 'Waseela Training Center',
      participants: 80
    }
  ];

  const recommendedProjects = [
    {
      id: 1,
      title: 'Education Support Program',
      category: 'Education',
      volunteers: 45,
      match: 95
    },
    {
      id: 2,
      title: 'Digital Literacy Workshop',
      category: 'Technology',
      volunteers: 25,
      match: 88
    }
  ];

  // Don't show loading if user data is available
  if (loading && !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto mb-4"></div>
          <p className="text-xl font-luxury-heading text-black">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showOnboardingWizard && (
        <OnboardingWizard
          isOpen={showOnboardingWizard}
          onComplete={async () => {
            setShowOnboardingWizard(false);
            await refreshUserData();
            const completion = calculateProfileCompletion();
            setProfileCompletion(completion);
          }}
          onSkip={() => setShowOnboardingWizard(false)}
        />
      )}
      <div className="min-h-screen bg-cream-white pt-28 pb-8 sm:pt-32 sm:pb-12 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-vibrant-orange/10 rounded-full animate-float-gentle"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-logo-teal/10 rounded-full animate-float-gentle" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-vibrant-orange-light/5 rounded-full animate-float-gentle" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
        {/* Welcome Header - Enhanced & Mobile Optimized */}
        <div className="mb-6 sm:mb-8 space-y-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 relative overflow-hidden border border-logo-navy/10">
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ background: currentTheme.colors.primary }}
            ></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-modern-display text-logo-navy font-bold">
                      Welcome back, {userData?.displayName || currentUser?.email?.split('@')[0] || 'Friend'}! 👋
                    </h1>
                    {userRole && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-vibrant-orange/10 rounded-full">
                        {React.createElement(getRoleIcon(userRole), { className: "w-4 h-4 text-vibrant-orange" })}
                        <span className="text-xs font-semibold text-vibrant-orange">{getRoleName(userRole)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-base sm:text-lg lg:text-xl text-logo-navy-light font-elegant-body">
                    {userRole === 'student' && 'Ready to build your portfolio and make an impact?'}
                    {userRole === 'ngo' && 'Ready to manage your projects and volunteers?'}
                    {userRole === 'volunteer' && 'Ready to make a difference today?'}
                    {!userRole && 'Ready to make a difference today?'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl sm:text-3xl font-modern-display font-bold" style={{ color: currentTheme.colors.primary }}>
                    {stats.impactScore}
                  </div>
                  <div className="text-xs sm:text-sm text-logo-navy-light font-medium">Impact Score</div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completion Card */}
          {userData && (!userData.onboardingCompleted || profileCompletion < 100) && (
            <div className="bg-gradient-to-r from-vibrant-orange/10 to-vibrant-orange-light/10 rounded-2xl shadow-lg p-4 sm:p-6 border border-vibrant-orange/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-vibrant-orange" />
                    <h3 className="text-lg font-bold text-black">Complete Your Profile</h3>
                  </div>
                  <p className="text-sm text-black/70 mb-3">
                    {!userData.onboardingCompleted 
                      ? 'Complete onboarding to unlock personalized features and recommendations.'
                      : `Your profile is ${profileCompletion}% complete. Add more information to get better matches.`
                    }
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-vibrant-orange h-2 rounded-full transition-all duration-300"
                      style={{ width: `${userData.onboardingCompleted ? profileCompletion : 0}%` }}
                    ></div>
                  </div>
                </div>
                <button
                  onClick={() => setShowOnboardingWizard(true)}
                  className="btn-luxury-primary px-6 py-3 flex items-center gap-2 whitespace-nowrap"
                >
                  {!userData.onboardingCompleted ? 'Complete Onboarding' : 'Complete Profile'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards - Enhanced & Mobile Optimized */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 text-center relative overflow-hidden group hover:shadow-xl transition-shadow border border-logo-navy/10">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
              style={{ backgroundColor: `${currentTheme.colors.primary}20` }}
            >
              <Target className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: currentTheme.colors.primary }} />
            </div>
            <div className="text-xl sm:text-2xl font-bold mb-1" style={{ color: currentTheme.colors.primary }}>{stats.projectsJoined}</div>
            <div className="text-xs sm:text-sm text-logo-navy font-medium">Projects Joined</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 text-center relative overflow-hidden group hover:shadow-xl transition-shadow border border-logo-navy/10">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
              style={{ backgroundColor: `${currentTheme.colors.accent}20` }}
            >
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: currentTheme.colors.accent }} />
            </div>
            <div className="text-xl sm:text-2xl font-bold mb-1" style={{ color: currentTheme.colors.accent }}>{stats.eventsAttended}</div>
            <div className="text-xs sm:text-sm text-logo-navy font-medium">Events Attended</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 text-center relative overflow-hidden group hover:shadow-xl transition-shadow">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
              style={{ backgroundColor: `${currentTheme.colors.secondary}20` }}
            >
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: currentTheme.colors.secondary }} />
            </div>
            <div className="text-xl sm:text-2xl font-bold mb-1" style={{ color: currentTheme.colors.secondary }}>{stats.hoursVolunteered}</div>
            <div className="text-xs sm:text-sm text-black/70">Hours Volunteered</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 text-center relative overflow-hidden group hover:shadow-xl transition-shadow">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
              style={{ backgroundColor: `${currentTheme.colors.primary}20` }}
            >
              <Award className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: currentTheme.colors.primary }} />
            </div>
            <div className="text-xl sm:text-2xl font-bold mb-1" style={{ color: currentTheme.colors.primary }}>{stats.impactScore}</div>
            <div className="text-xs sm:text-sm text-black/70">Impact Score</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions - Enhanced & Mobile Optimized */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className="relative overflow-hidden p-6 rounded-luxury border-2 border-gray-200 floating-card magnetic-element group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center group-hover:animate-pulse-glow group-hover:scale-110 transition-all duration-300`}>
                        <action.icon className="w-6 h-6 text-white group-hover:animate-float-gentle" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-luxury-heading text-black group-hover:text-gradient-animated transition-all duration-500">
                          {action.title}
                        </h3>
                        <p className="text-sm text-black/70 group-hover:text-gray-800 transition-colors">{action.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-vibrant-orange group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-vibrant-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-luxury"></div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="luxury-card bg-white p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-luxury-heading text-black">Recent Activity</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      activeFilter === 'all' 
                        ? 'bg-vibrant-orange text-white' 
                        : 'bg-gray-100 text-black hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFilter('applications')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      activeFilter === 'applications' 
                        ? 'bg-vibrant-orange text-white' 
                        : 'bg-gray-100 text-black hover:bg-gray-200'
                    }`}
                  >
                    Applications
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-luxury">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${currentTheme.colors.primary}20` }}
                      >
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1">
                        <p className="text-black font-luxury-body">{getActivityDescription(activity)}</p>
                        <p className="text-sm text-black/70">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-black/70">No recent activity. Start exploring to see your activity here!</p>
                  </div>
                )}
              </div>
            </div>

            {/* My Submissions */}
            <div className="luxury-card bg-white p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-luxury-heading text-black">My Submissions</h2>
                <Link
                  to="/create-submission"
                  className="text-vibrant-orange hover:text-vibrant-orange-dark text-sm font-medium flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Submission
                </Link>
              </div>

              {submissions.length > 0 ? (
                <div className="space-y-4">
                  {submissions.map((submission) => {
                    const getStatusColor = (status: SubmissionStatus) => {
                      switch (status) {
                        case 'pending': return 'bg-yellow-100 text-yellow-800';
                        case 'approved': return 'bg-green-100 text-green-800';
                        case 'rejected': return 'bg-red-100 text-red-800';
                        default: return 'bg-gray-100 text-gray-800';
                      }
                    };

                    return (
                      <div key={submission.id} className="p-4 border-2 border-gray-200 rounded-luxury hover:border-vibrant-orange transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-luxury-heading text-black">{submission.title}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-black/70 font-luxury-body mb-2 line-clamp-2">{submission.description}</p>
                        <div className="flex items-center justify-between text-xs text-black/70">
                          <span className="font-luxury-body">
                            {submission.submissionType.charAt(0).toUpperCase() + submission.submissionType.slice(1)}
                          </span>
                          <span className="font-luxury-body">
                            {submission.submittedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                          </span>
                        </div>
                        {submission.adminComments && (
                          <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                            <strong className="text-black">Admin Note:</strong> {submission.adminComments}
                          </div>
                        )}
                        {submission.rejectionReason && (
                          <div className="mt-3 p-2 bg-red-50 rounded text-xs">
                            <strong className="text-red-700">Rejection Reason:</strong> {submission.rejectionReason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-black/70 mb-4">No submissions yet</p>
                  <Link to="/create-submission" className="btn-luxury-primary inline-flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Submission
                  </Link>
                </div>
              )}
            </div>

            {/* My Drafts */}
            <DraftsList drafts={drafts} />

            {/* My Reminders */}
            <div className="luxury-card bg-white p-8">
              <RemindersPanel />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Upcoming Events */}
            <div className="luxury-card bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-luxury-heading text-black">Upcoming Events</h3>
                <Link to="/events" className="text-vibrant-orange hover:text-vibrant-orange-dark text-sm font-medium">
                  View All
                </Link>
              </div>
              
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="p-4 bg-gray-50 rounded-luxury">
                    <h4 className="font-luxury-semibold text-black text-sm mb-2">{event.title}</h4>
                    <div className="space-y-1 text-xs text-black/70">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-2" />
                        {event.date} at {event.time}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-2" />
                        {event.location}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-2" />
                        {event.participants} expected
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Projects */}
            <div className="luxury-card bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-luxury-heading text-black">Recommended for You</h3>
                <Link to="/projects" className="text-vibrant-orange hover:text-vibrant-orange-dark text-sm font-medium">
                  View All
                </Link>
              </div>
              
              <div className="space-y-4">
                {recommendedProjects.map((project) => (
                  <div key={project.id} className="p-4 bg-gray-50 rounded-luxury">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-luxury-semibold text-black text-sm">{project.title}</h4>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span className="text-xs text-black/70">{project.match}% match</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-black/70">
                      <div className="flex items-center justify-between">
                        <span>{project.category}</span>
                        <span>{project.volunteers} volunteers</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Completion */}
            <div className="luxury-card bg-gradient-to-br from-vibrant-orange/10 to-vibrant-orange-light/10 p-6">
              <h3 className="text-lg font-luxury-heading text-black mb-4">Complete Your Profile</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black">Basic Info</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black">Interests</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black">Skills</span>
                  <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                </div>
              </div>
              <Link 
                to="/volunteer" 
                className="block w-full text-center mt-4 px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-dark transition-colors text-sm font-medium"
              >
                Complete Profile
              </Link>
            </div>

            {/* Preferences & Security */}
            <div className="luxury-card bg-white p-6 space-y-6">
              <h3 className="text-lg font-luxury-heading text-black flex items-center gap-2">
                <Settings className="w-4 h-4" /> Preferences & Security
              </h3>

              {/* Theme Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-luxury-semibold text-black flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Theme
                  </span>
                  <span className="text-xs text-black/60">Current: {currentTheme.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-3 rounded-luxury border-2 transition-all text-left relative ${
                        currentTheme.id === t.id
                          ? 'border-vibrant-orange shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      aria-label={`Select ${t.name}`}
                    >
                      {/* Special Theme Badge */}
                      {t.isSpecial && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <span className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                            <Sparkles className="w-3 h-3" /> Special
                          </span>
                        </div>
                      )}
                      <div
                        className="h-10 w-full rounded-md mb-2 relative overflow-hidden"
                        style={{ background: t.preview }}
                      >
                        {/* Video indicator for Wasillah Special */}
                        {t.hasHeroVideo && (
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Video
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium text-black flex items-center gap-1">
                        {t.name}
                        {currentTheme.id === t.id && (
                          <CheckCircle className="w-4 h-4 text-vibrant-orange" />
                        )}
                      </div>
                      <div className="text-xs text-black/60">{t.description}</div>
                      {/* Feature indicators */}
                      {(t.hasHeroVideo || t.hasSectionBackgrounds) && (
                        <div className="flex gap-1 mt-2">
                          {t.hasHeroVideo && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              Hero Videos
                            </span>
                          )}
                          {t.hasSectionBackgrounds && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Backgrounds
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-black/60">Active theme: <span className="font-medium">{currentTheme.name}</span></div>
              </div>

              {/* Email Verification */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-luxury-semibold text-black flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email verification
                  </span>
                  {currentUser?.emailVerified ? (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Not verified
                    </span>
                  )}
                </div>
                {!currentUser?.emailVerified && (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await resendEmailVerification();
                          setEmailMessage('Verification email sent. Please check your inbox.');
                        } catch (e: any) {
                          setEmailMessage(e?.message || 'Failed to send verification email');
                        }
                      }}
                      className="px-3 py-2 rounded-luxury bg-vibrant-orange text-white text-sm hover:bg-vibrant-orange-light"
                    >
                      Resend verification
                    </button>
                    <button
                      onClick={async () => { try { await currentUser?.reload(); } catch {} }}
                      className="px-3 py-2 rounded-luxury border-2 border-gray-200 text-sm hover:bg-gray-50 flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" /> Refresh status
                    </button>
                  </div>
                )}
                {emailMessage && (
                  <p className="text-xs mt-2 text-black/70">{emailMessage}</p>
                )}
              </div>

              {/* Change Password */}
              <div className="pt-2 border-t border-gray-200">
                <div className="text-sm font-luxury-semibold text-black mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Change password
                </div>
                <div className="space-y-2">
                  <input
                    type="password"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-luxury text-sm"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-luxury text-sm"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        setPasswordMessage(null);
                        if (!newPassword || newPassword.length < 6) {
                          setPasswordMessage('Password must be at least 6 characters.');
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          setPasswordMessage('Passwords do not match.');
                          return;
                        }
                        try {
                          await updatePassword(newPassword);
                          setPasswordMessage('Password updated successfully.');
                          setNewPassword('');
                          setConfirmPassword('');
                        } catch (e: any) {
                          const msg = e?.code === 'auth/requires-recent-login'
                            ? 'Please sign in again or use the reset link below.'
                            : e?.message || 'Failed to update password';
                          setPasswordMessage(msg);
                        }
                      }}
                      className="px-3 py-2 rounded-luxury bg-vibrant-orange text-white text-sm hover:bg-vibrant-orange-light"
                    >
                      Update password
                    </button>
                    <button
                      onClick={async () => {
                        if (!currentUser?.email) { setPasswordMessage('No email on account.'); return; }
                        try {
                          await resetPassword(currentUser.email);
                          setPasswordMessage('Password reset email sent.');
                        } catch (e: any) {
                          setPasswordMessage(e?.message || 'Failed to send reset email');
                        }
                      }}
                      className="px-3 py-2 rounded-luxury border-2 border-gray-200 text-sm hover:bg-gray-50"
                    >
                      Send reset email
                    </button>
                  </div>
                  {passwordMessage && (
                    <p className="text-xs text-black/70">{passwordMessage}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;