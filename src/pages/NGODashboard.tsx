import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Target, Calendar, TrendingUp, MessageSquare, DollarSign, Plus, FileText, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ProjectSubmission, EventSubmission, ProjectApplicationEntry, EventRegistrationEntry } from '../types/submissions';

interface NGOStats {
  totalProjects: number;
  activeProjects: number;
  totalEvents: number;
  totalApplications: number;
  totalVolunteers: number;
  impactReach: number;
}

const NGODashboard = () => {
  const { currentUser, userData } = useAuth();
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NGOStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalEvents: 0,
    totalApplications: 0,
    totalVolunteers: 0,
    impactReach: 0
  });
  const [myProjects, setMyProjects] = useState<ProjectSubmission[]>([]);
  const [myEvents, setMyEvents] = useState<EventSubmission[]>([]);
  const [recentApplications, setRecentApplications] = useState<ProjectApplicationEntry[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<(ProjectSubmission | EventSubmission)[]>([]);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
      setupRealtimeListeners();
    }
  }, [currentUser]);

  const setupRealtimeListeners = () => {
    if (!currentUser) return;

    try {
      // Listen to user's projects with error handling
      const projectsQuery = query(
        collection(db, 'project_submissions'),
        where('submittedBy', '==', currentUser.uid),
        orderBy('submittedAt', 'desc')
      );
      const unsubscribeProjects = onSnapshot(
        projectsQuery, 
        (snapshot) => {
          const projects: ProjectSubmission[] = [];
          snapshot.forEach((doc) => {
            projects.push({ id: doc.id, ...doc.data() } as ProjectSubmission);
          });
          setMyProjects(projects);
          
          // Update stats
          const active = projects.filter(p => p.status === 'approved' && p.isVisible).length;
          setStats(prev => ({
            ...prev,
            totalProjects: projects.length,
            activeProjects: active
          }));
        },
        (error) => {
          console.error('Error listening to projects:', error);
          // Silently fail - don't crash the app
        }
      );

      // Listen to user's events with error handling
      const eventsQuery = query(
        collection(db, 'event_submissions'),
        where('submittedBy', '==', currentUser.uid),
        orderBy('submittedAt', 'desc')
      );
      const unsubscribeEvents = onSnapshot(
        eventsQuery, 
        (snapshot) => {
          const events: EventSubmission[] = [];
          snapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() } as EventSubmission);
          });
          setMyEvents(events);
          setStats(prev => ({ ...prev, totalEvents: events.length }));
        },
        (error) => {
          console.error('Error listening to events:', error);
          // Silently fail - don't crash the app
        }
      );

      return () => {
        unsubscribeProjects();
        unsubscribeEvents();
      };
    } catch (error) {
      console.error('Error setting up real-time listeners:', error);
      return () => {}; // Return empty cleanup function
    }
  };

  const fetchDashboardData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);

      // Fetch user's projects
      const projectsQuery = query(
        collection(db, 'project_submissions'),
        where('submittedBy', '==', currentUser.uid),
        orderBy('submittedAt', 'desc')
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projects: ProjectSubmission[] = [];
      projectsSnapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() } as ProjectSubmission);
      });
      setMyProjects(projects);

      // Fetch user's events
      const eventsQuery = query(
        collection(db, 'event_submissions'),
        where('submittedBy', '==', currentUser.uid),
        orderBy('submittedAt', 'desc')
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const events: EventSubmission[] = [];
      eventsSnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as EventSubmission);
      });
      setMyEvents(events);

      // Fetch applications for user's projects
      let totalApplications = 0;
      const applications: ProjectApplicationEntry[] = [];
      
      for (const project of projects) {
        const appQuery = query(
          collection(db, `project_submissions/${project.id}/applications`),
          orderBy('submittedAt', 'desc')
        );
        const appSnapshot = await getDocs(appQuery);
        appSnapshot.forEach((doc) => {
          applications.push({ id: doc.id, ...doc.data(), projectId: project.id, projectTitle: project.title } as ProjectApplicationEntry);
          totalApplications++;
        });
      }

      // Get recent applications (last 5)
      setRecentApplications(applications.slice(0, 5));

      // Calculate unique volunteers
      const uniqueVolunteers = new Set<string>();
      projects.forEach(p => {
        p.participantIds?.forEach(id => uniqueVolunteers.add(id));
      });
      events.forEach(e => {
        e.attendeeIds?.forEach(id => uniqueVolunteers.add(id));
      });

      // Calculate impact reach
      const totalImpact = [...projects, ...events].reduce((sum, item) => {
        return sum + ((item as any).peopleImpacted || 0);
      }, 0);

      // Find pending submissions
      const pending = [...projects, ...events].filter(item => item.status === 'pending');
      setPendingSubmissions(pending);

      setStats({
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'approved' && p.isVisible).length,
        totalEvents: events.length,
        totalApplications,
        totalVolunteers: uniqueVolunteers.size,
        impactReach: totalImpact
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
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
    <div className="min-h-screen bg-cream-white pt-28 pb-8 sm:pt-32 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-logo-navy mb-2 flex items-center gap-3">
            <Building2 className="w-10 h-10 text-vibrant-orange" />
            Welcome, {userData?.ngoInfo?.organizationName || userData?.displayName || 'Organization'}! 🏢
          </h1>
          <p className="text-lg text-gray-600">Manage your projects, volunteers, and impact</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-logo-navy">{stats.totalProjects}</div>
            <div className="text-xs text-gray-600">Total Projects</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-logo-navy">{stats.activeProjects}</div>
            <div className="text-xs text-gray-600">Active Projects</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-logo-navy">{stats.totalEvents}</div>
            <div className="text-xs text-gray-600">Events</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-logo-navy">{stats.totalApplications}</div>
            <div className="text-xs text-gray-600">Applications</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-logo-navy">{stats.totalVolunteers}</div>
            <div className="text-xs text-gray-600">Volunteers</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-logo-navy">{stats.impactReach}</div>
            <div className="text-xs text-gray-600">People Impacted</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Management */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-logo-navy">My Projects</h2>
                <Link 
                  to="/create-submission?type=project" 
                  className="px-4 py-2 bg-vibrant-orange text-white rounded-lg hover:bg-vibrant-orange-dark transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </Link>
              </div>
              
              {myProjects.length > 0 ? (
                <div className="space-y-3">
                  {myProjects.slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-vibrant-orange transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-logo-navy">{project.title}</h3>
                            {getStatusIcon(project.status)}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">{project.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{project.participantIds?.length || 0} volunteers</span>
                        <Link to={`/projects/${project.id}`} className="text-vibrant-orange hover:underline">
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">You haven't created any projects yet</p>
                  <Link to="/create-submission?type=project" className="btn-luxury-primary inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create First Project
                  </Link>
                </div>
              )}
            </div>

            {/* Event Management */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-logo-navy">My Events</h2>
                <Link 
                  to="/create-submission?type=event" 
                  className="px-4 py-2 bg-vibrant-orange text-white rounded-lg hover:bg-vibrant-orange-dark transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Event
                </Link>
              </div>
              
              {myEvents.length > 0 ? (
                <div className="space-y-3">
                  {myEvents.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-vibrant-orange transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-logo-navy">{event.title}</h3>
                            {getStatusIcon(event.status)}
                          </div>
                          <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{event.attendeeIds?.length || 0} attendees</span>
                        <Link to={`/events/${event.id}`} className="text-vibrant-orange hover:underline">
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">You haven't created any events yet</p>
                  <Link to="/create-submission?type=event" className="btn-luxury-primary inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create First Event
                  </Link>
                </div>
              )}
            </div>

            {/* Volunteer Applications */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-logo-navy mb-4">Recent Applications</h2>
              
              {recentApplications.length > 0 ? (
                <div className="space-y-3">
                  {recentApplications.map((app) => (
                    <div key={app.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-logo-navy">{app.name}</h4>
                          <p className="text-sm text-gray-600">{app.email}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {app.submittedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Project:</strong> {app.projectTitle}
                      </p>
                      {app.motivation && (
                        <p className="text-xs text-gray-600 line-clamp-2">{app.motivation}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No applications yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Pending Submissions Alert */}
            {pendingSubmissions.length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-logo-navy mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Pending Review
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  You have {pendingSubmissions.length} submission{pendingSubmissions.length !== 1 ? 's' : ''} waiting for admin approval.
                </p>
                <Link to="/dashboard" className="text-vibrant-orange hover:underline text-sm font-medium">
                  View All Submissions →
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-logo-navy mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/create-submission?type=project"
                  className="block p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-logo-navy">Create Project</div>
                      <div className="text-xs text-gray-600">Post a new opportunity</div>
                    </div>
                  </div>
                </Link>
                <Link
                  to="/create-submission?type=event"
                  className="block p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-semibold text-logo-navy">Create Event</div>
                      <div className="text-xs text-gray-600">Schedule a new event</div>
                    </div>
                  </div>
                </Link>
                <Link
                  to="/dashboard"
                  className="block p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-semibold text-logo-navy">View All</div>
                      <div className="text-xs text-gray-600">See all submissions</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Impact Analytics */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-logo-navy mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Impact Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Active Volunteers</span>
                  <span className="font-bold text-logo-navy">{stats.totalVolunteers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">People Reached</span>
                  <span className="font-bold text-logo-navy">{stats.impactReach}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Success Rate</span>
                  <span className="font-bold text-logo-navy">
                    {stats.totalProjects > 0 ? Math.round((stats.activeProjects / stats.totalProjects) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Communication Center */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-logo-navy mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-vibrant-orange" />
                Communication
              </h3>
              <div className="space-y-3">
                <Link
                  to="/contact"
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="text-sm font-semibold text-logo-navy">Contact Support</div>
                  <div className="text-xs text-gray-600">Get help with your projects</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;
