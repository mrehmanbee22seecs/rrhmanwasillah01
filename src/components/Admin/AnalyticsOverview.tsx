/**
 * AnalyticsOverview Component
 * Analytics and statistics dashboard for admin
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Target, Calendar, CheckCircle, XCircle, Clock, Eye, EyeOff, BarChart3, Download } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { SubmissionStatus } from '../../types/submissions';
import * as XLSX from 'xlsx';

export interface AnalyticsData {
  // User Statistics
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  usersByRole: {
    student: number;
    ngo: number;
    volunteer: number;
    admin: number;
  };

  // Submission Statistics
  totalSubmissions: number;
  submissionsByStatus: {
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
  };
  submissionsByType: {
    project: number;
    event: number;
  };
  submissionsThisMonth: number;
  submissionsThisWeek: number;

  // Application Statistics
  totalApplications: number;
  projectApplications: number;
  eventRegistrations: number;
  applicationRate: number; // Applications per submission

  // Engagement Metrics
  averageApplicationsPerSubmission: number;
  approvalRate: number;
  rejectionRate: number;
  visibilityRate: number;

  // Time-based Statistics
  submissionsByMonth: Array<{ month: string; count: number }>;
  applicationsByMonth: Array<{ month: string; count: number }>;

  // System Health
  pendingReviews: number;
  flaggedContent: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface AnalyticsOverviewProps {
  refreshTrigger?: number;
  onExport?: () => void;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  refreshTrigger = 0,
  onExport,
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map((doc) => doc.data());
      const totalUsers = users.length;
      const newUsersThisMonth = users.filter(
        (user) => user.createdAt?.toDate?.() > monthAgo
      ).length;
      const activeUsers = users.filter(
        (user) => user.lastLogin?.toDate?.() > weekAgo
      ).length;

      // Fetch submissions
      const projectSubmissionsSnapshot = await getDocs(
        query(collection(db, 'project_submissions'), orderBy('submittedAt', 'desc'))
      );
      const eventSubmissionsSnapshot = await getDocs(
        query(collection(db, 'event_submissions'), orderBy('submittedAt', 'desc'))
      );

      const projectSubmissions = projectSubmissionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: 'project',
      }));
      const eventSubmissions = eventSubmissionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: 'event',
      }));
      const allSubmissions = [...projectSubmissions, ...eventSubmissions];

      // Fetch applications
      const projectApplicationsSnapshot = await getDocs(collection(db, 'project_applications'));
      const eventRegistrationsSnapshot = await getDocs(collection(db, 'event_registrations'));

      const projectApplications = projectApplicationsSnapshot.docs.length;
      const eventRegistrations = eventRegistrationsSnapshot.docs.length;
      const totalApplications = projectApplications + eventRegistrations;

      // Calculate statistics
      const submissionsByStatus = {
        draft: allSubmissions.filter((s) => s.status === 'draft').length,
        pending: allSubmissions.filter((s) => s.status === 'pending').length,
        approved: allSubmissions.filter((s) => s.status === 'approved').length,
        rejected: allSubmissions.filter((s) => s.status === 'rejected').length,
        completed: allSubmissions.filter((s) => s.status === 'completed').length,
      };

      const submissionsThisMonth = allSubmissions.filter(
        (s) => s.submittedAt?.toDate?.() > monthAgo
      ).length;
      const submissionsThisWeek = allSubmissions.filter(
        (s) => s.submittedAt?.toDate?.() > weekAgo
      ).length;

      const approvalRate =
        allSubmissions.length > 0
          ? (submissionsByStatus.approved / allSubmissions.length) * 100
          : 0;
      const rejectionRate =
        allSubmissions.length > 0
          ? (submissionsByStatus.rejected / allSubmissions.length) * 100
          : 0;

      const visibleSubmissions = allSubmissions.filter((s) => s.isVisible === true).length;
      const visibilityRate =
        allSubmissions.length > 0 ? (visibleSubmissions / allSubmissions.length) * 100 : 0;

      const applicationRate =
        allSubmissions.length > 0 ? totalApplications / allSubmissions.length : 0;

      // Users by role
      const usersByRole = {
        student: users.filter((u) => u.role === 'student').length,
        ngo: users.filter((u) => u.role === 'ngo').length,
        volunteer: users.filter((u) => u.role === 'volunteer').length,
        admin: users.filter((u) => u.role === 'admin' || u.isAdmin).length,
      };

      // System health
      const pendingReviews = submissionsByStatus.pending;
      const systemHealth =
        pendingReviews > 50 ? 'critical' : pendingReviews > 20 ? 'warning' : 'healthy';

      const analyticsData: AnalyticsData = {
        totalUsers,
        newUsersThisMonth,
        activeUsers,
        usersByRole,
        totalSubmissions: allSubmissions.length,
        submissionsByStatus,
        submissionsByType: {
          project: projectSubmissions.length,
          event: eventSubmissions.length,
        },
        submissionsThisMonth,
        submissionsThisWeek,
        totalApplications,
        projectApplications,
        eventRegistrations,
        applicationRate,
        averageApplicationsPerSubmission: applicationRate,
        approvalRate,
        rejectionRate,
        visibilityRate,
        submissionsByMonth: [], // Would need to calculate from data
        applicationsByMonth: [], // Would need to calculate from data
        pendingReviews,
        flaggedContent: 0, // Would need to fetch from flagged content collection
        systemHealth,
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analytics) return;

    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Users', analytics.totalUsers],
        ['New Users This Month', analytics.newUsersThisMonth],
        ['Active Users', analytics.activeUsers],
        ['Total Submissions', analytics.totalSubmissions],
        ['Pending Reviews', analytics.pendingReviews],
        ['Approval Rate', `${analytics.approvalRate.toFixed(2)}%`],
        ['Rejection Rate', `${analytics.rejectionRate.toFixed(2)}%`],
        ['Total Applications', analytics.totalApplications],
        ['Application Rate', analytics.applicationRate.toFixed(2)],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Status breakdown
      const statusData = [
        ['Status', 'Count'],
        ['Draft', analytics.submissionsByStatus.draft],
        ['Pending', analytics.submissionsByStatus.pending],
        ['Approved', analytics.submissionsByStatus.approved],
        ['Rejected', analytics.submissionsByStatus.rejected],
        ['Completed', analytics.submissionsByStatus.completed],
      ];
      const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
      XLSX.utils.book_append_sheet(workbook, statusSheet, 'Status Breakdown');

      XLSX.writeFile(workbook, `analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
      if (onExport) onExport();
    } catch (error) {
      console.error('Error exporting analytics:', error);
      alert('Error exporting analytics');
    }
  };

  if (loading) {
    return (
      <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-6">
        <div className="text-cream-elegant text-center">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-6">
        <div className="text-cream-elegant text-center">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-cream-elegant font-semibold text-xl flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Analytics Overview</span>
        </h2>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-1 bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant focus:outline-none focus:border-vibrant-orange"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-light transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* System Health */}
      <div className={`p-4 rounded-luxury-lg border-2 ${
        analytics.systemHealth === 'healthy' ? 'border-green-500 bg-green-500/10' :
        analytics.systemHealth === 'warning' ? 'border-yellow-500 bg-yellow-500/10' :
        'border-red-500 bg-red-500/10'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-cream-elegant font-semibold">System Health: {analytics.systemHealth}</span>
          <span className="text-cream-elegant/80">{analytics.pendingReviews} pending reviews</span>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-4">
          <div className="flex items-center space-x-2 text-cream-elegant/80 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total Users</span>
          </div>
          <div className="text-2xl font-bold text-cream-elegant">{analytics.totalUsers}</div>
        </div>
        <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-4">
          <div className="flex items-center space-x-2 text-cream-elegant/80 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">New This Month</span>
          </div>
          <div className="text-2xl font-bold text-cream-elegant">{analytics.newUsersThisMonth}</div>
        </div>
        <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-4">
          <div className="flex items-center space-x-2 text-cream-elegant/80 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Active Users</span>
          </div>
          <div className="text-2xl font-bold text-cream-elegant">{analytics.activeUsers}</div>
        </div>
        <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-4">
          <div className="flex items-center space-x-2 text-cream-elegant/80 mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Application Rate</span>
          </div>
          <div className="text-2xl font-bold text-cream-elegant">{analytics.applicationRate.toFixed(2)}</div>
        </div>
      </div>

      {/* Submission Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-4">
          <div className="flex items-center space-x-2 text-cream-elegant/80 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-sm">Total Submissions</span>
          </div>
          <div className="text-2xl font-bold text-cream-elegant">{analytics.totalSubmissions}</div>
          <div className="text-sm text-cream-elegant/60 mt-1">
            {analytics.submissionsThisMonth} this month
          </div>
        </div>
        <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-4">
          <div className="flex items-center space-x-2 text-cream-elegant/80 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Approval Rate</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{analytics.approvalRate.toFixed(1)}%</div>
          <div className="text-sm text-cream-elegant/60 mt-1">
            {analytics.submissionsByStatus.approved} approved
          </div>
        </div>
        <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-4">
          <div className="flex items-center space-x-2 text-cream-elegant/80 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pending Reviews</span>
          </div>
          <div className="text-2xl font-bold text-yellow-500">{analytics.pendingReviews}</div>
          <div className="text-sm text-cream-elegant/60 mt-1">
            {analytics.submissionsByStatus.pending} pending
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-4">
        <h3 className="text-cream-elegant font-semibold mb-4">Submission Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cream-elegant/60">{analytics.submissionsByStatus.draft}</div>
            <div className="text-sm text-cream-elegant/80">Draft</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{analytics.submissionsByStatus.pending}</div>
            <div className="text-sm text-cream-elegant/80">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{analytics.submissionsByStatus.approved}</div>
            <div className="text-sm text-cream-elegant/80">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{analytics.submissionsByStatus.rejected}</div>
            <div className="text-sm text-cream-elegant/80">Rejected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{analytics.submissionsByStatus.completed}</div>
            <div className="text-sm text-cream-elegant/80">Completed</div>
          </div>
        </div>
      </div>

      {/* Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-4">
          <h3 className="text-cream-elegant font-semibold mb-2">Submissions by Type</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-cream-elegant">Projects</span>
              <span className="text-cream-elegant font-semibold">{analytics.submissionsByType.project}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-cream-elegant">Events</span>
              <span className="text-cream-elegant font-semibold">{analytics.submissionsByType.event}</span>
            </div>
          </div>
        </div>
        <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-4">
          <h3 className="text-cream-elegant font-semibold mb-2">Applications</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-cream-elegant">Project Applications</span>
              <span className="text-cream-elegant font-semibold">{analytics.projectApplications}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-cream-elegant">Event Registrations</span>
              <span className="text-cream-elegant font-semibold">{analytics.eventRegistrations}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-vibrant-orange/30">
              <span className="text-cream-elegant font-semibold">Total</span>
              <span className="text-cream-elegant font-semibold">{analytics.totalApplications}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;

