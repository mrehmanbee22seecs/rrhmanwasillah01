import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Calendar, Heart, Plus, ChevronRight, BookOpen, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { collection, query, where, getDocs, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import ImpactSummary from '../components/Dashboard/ImpactSummary';
import TaskChecklist, { Task } from '../components/Dashboard/TaskChecklist';
import PersonalNotes, { Note } from '../components/Dashboard/PersonalNotes';
import { ProjectSubmission, EventSubmission } from '../types/submissions';

interface UserStats {
  projectsJoined: number;
  eventsAttended: number;
  hoursVolunteered: number;
  impactScore: number;
}

const VolunteerDashboard = () => {
  const { currentUser, userData } = useAuth();
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    projectsJoined: 0,
    eventsAttended: 0,
    hoursVolunteered: 0,
    impactScore: 0
  });
  const [activeProjects, setActiveProjects] = useState<ProjectSubmission[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventSubmission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [recommendedOpportunities, setRecommendedOpportunities] = useState<ProjectSubmission[]>([]);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
      setupRealtimeListeners();
    }
  }, [currentUser]);

  const setupRealtimeListeners = () => {
    if (!currentUser) return;

    // Listen to tasks
    const tasksQuery = query(
      collection(db, 'user_tasks'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const fetchedTasks: Task[] = [];
      snapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(fetchedTasks);
    });

    // Listen to notes
    const notesQuery = query(
      collection(db, 'user_notes'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const fetchedNotes: Note[] = [];
      snapshot.forEach((doc) => {
        fetchedNotes.push({ id: doc.id, ...doc.data() } as Note);
      });
      setNotes(fetchedNotes);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeNotes();
    };
  };

  const fetchDashboardData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);

      // Fetch user's active projects
      const projectsQuery = query(
        collection(db, 'project_submissions'),
        where('status', '==', 'approved'),
        where('isVisible', '==', true)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const allProjects: ProjectSubmission[] = [];
      projectsSnapshot.forEach((doc) => {
        allProjects.push({ id: doc.id, ...doc.data() } as ProjectSubmission);
      });

      // Filter projects user has joined
      const userActiveProjects = allProjects.filter(p => 
        p.participantIds?.includes(currentUser.uid) || p.submittedBy === currentUser.uid
      );
      setActiveProjects(userActiveProjects);

      // Fetch upcoming events
      const eventsQuery = query(
        collection(db, 'event_submissions'),
        where('status', '==', 'approved'),
        where('isVisible', '==', true),
        orderBy('date', 'asc')
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const allEvents: EventSubmission[] = [];
      eventsSnapshot.forEach((doc) => {
        allEvents.push({ id: doc.id, ...doc.data() } as EventSubmission);
      });

      // Filter upcoming events (future dates)
      const today = new Date().toISOString().split('T')[0];
      const upcoming = allEvents.filter(e => e.date >= today).slice(0, 5);
      setUpcomingEvents(upcoming);

      // Calculate stats
      const userEvents = allEvents.filter(e => 
        e.attendeeIds?.includes(currentUser.uid) || e.submittedBy === currentUser.uid
      );
      
      const totalHours = [...userActiveProjects, ...userEvents].reduce((sum, item) => {
        return sum + ((item as any).durationHours || 2);
      }, 0);

      const impactScore = 
        (userActiveProjects.length * 10) + 
        (userEvents.length * 5) + 
        Math.floor(totalHours / 2);

      setStats({
        projectsJoined: userActiveProjects.length,
        eventsAttended: userEvents.length,
        hoursVolunteered: Math.round(totalHours),
        impactScore
      });

      // Recommended opportunities (projects user hasn't joined)
      const userInterests = userData?.interests || [];
      const recommended = allProjects
        .filter(p => !p.participantIds?.includes(currentUser.uid) && p.submittedBy !== currentUser.uid)
        .slice(0, 3);
      setRecommendedOpportunities(recommended);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (text: string, projectId?: string) => {
    if (!currentUser) return;
    
    try {
      const project = activeProjects.find(p => p.id === projectId);
      await addDoc(collection(db, 'user_tasks'), {
        userId: currentUser.uid,
        text,
        completed: false,
        projectId: projectId || null,
        projectTitle: project?.title || null,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      await updateDoc(doc(db, 'user_tasks', taskId), {
        completed: !task.completed,
        completedAt: !task.completed ? serverTimestamp() : null
      });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'user_tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, text: string) => {
    try {
      await updateDoc(doc(db, 'user_tasks', taskId), {
        text,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleAddNote = async (title: string, content: string, projectId?: string) => {
    if (!currentUser) return;
    
    try {
      const project = activeProjects.find(p => p.id === projectId);
      await addDoc(collection(db, 'user_notes'), {
        userId: currentUser.uid,
        title,
        content,
        projectId: projectId || null,
        projectTitle: project?.title || null,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleUpdateNote = async (noteId: string, title: string, content: string) => {
    try {
      await updateDoc(doc(db, 'user_notes', noteId), {
        title,
        content,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteDoc(doc(db, 'user_notes', noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
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
          <h1 className="text-3xl sm:text-4xl font-bold text-logo-navy mb-2">
            Welcome back, {userData?.displayName || 'Volunteer'}! 👋
          </h1>
          <p className="text-lg text-gray-600">Here's your volunteer journey at a glance</p>
        </div>

        {/* Impact Summary */}
        <div className="mb-8">
          <ImpactSummary stats={stats} themeColor={currentTheme.colors.primary} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Projects */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-logo-navy">Active Projects</h2>
                <Link to="/projects" className="text-vibrant-orange hover:text-vibrant-orange-dark text-sm font-medium">
                  Browse More
                </Link>
              </div>
              
              {activeProjects.length > 0 ? (
                <div className="space-y-4">
                  {activeProjects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block p-4 border-2 border-gray-200 rounded-lg hover:border-vibrant-orange transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-logo-navy mb-1">{project.title}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{project.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {project.location}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {project.category}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">You haven't joined any projects yet</p>
                  <Link to="/projects" className="btn-luxury-primary inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Find Projects
                  </Link>
                </div>
              )}
            </div>

            {/* Task Checklist */}
            <TaskChecklist
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onUpdateTask={handleUpdateTask}
              themeColor={currentTheme.colors.primary}
            />

            {/* Personal Notes */}
            <PersonalNotes
              notes={notes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              themeColor={currentTheme.colors.primary}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-logo-navy mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/projects"
                  className="block p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-logo-navy">Find Projects</div>
                      <div className="text-xs text-gray-600">Discover new opportunities</div>
                    </div>
                  </div>
                </Link>
                <Link
                  to="/events"
                  className="block p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-semibold text-logo-navy">Browse Events</div>
                      <div className="text-xs text-gray-600">Join community events</div>
                    </div>
                  </div>
                </Link>
                <Link
                  to="/volunteer"
                  className="block p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-semibold text-logo-navy">Update Profile</div>
                      <div className="text-xs text-gray-600">Manage your information</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-logo-navy">Upcoming Events</h3>
                <Link to="/events" className="text-vibrant-orange hover:text-vibrant-orange-dark text-sm font-medium">
                  View All
                </Link>
              </div>
              
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-logo-navy text-sm mb-1">{event.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {event.date}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">No upcoming events</p>
              )}
            </div>

            {/* Recommended Opportunities */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-logo-navy mb-4">Recommended for You</h3>
              
              {recommendedOpportunities.length > 0 ? (
                <div className="space-y-3">
                  {recommendedOpportunities.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-logo-navy text-sm mb-1">{project.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{project.description}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">No recommendations yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
