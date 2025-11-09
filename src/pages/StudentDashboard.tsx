import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Target, Calendar, Award, BookOpen, TrendingUp, FileText, Plus, ChevronRight } from 'lucide-react';
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

interface SkillProgress {
  skill: string;
  level: number; // 0-100
  projects: number;
}

const StudentDashboard = () => {
  const { currentUser, userData } = useAuth();
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    projectsJoined: 0,
    eventsAttended: 0,
    hoursVolunteered: 0,
    impactScore: 0
  });
  const [csrProjects, setCsrProjects] = useState<ProjectSubmission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([]);
  const [certificates, setCertificates] = useState<number>(0);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
      setupRealtimeListeners();
    }
  }, [currentUser]);

  const setupRealtimeListeners = () => {
    if (!currentUser) return;

    try {
      // Listen to tasks with error handling
      const tasksQuery = query(
        collection(db, 'user_tasks'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribeTasks = onSnapshot(
        tasksQuery, 
        (snapshot) => {
          const fetchedTasks: Task[] = [];
          snapshot.forEach((doc) => {
            fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
          });
          setTasks(fetchedTasks);
        },
        (error) => {
          console.error('Error listening to tasks:', error);
          // Silently fail - don't crash the app
        }
      );

      // Listen to notes with error handling
      const notesQuery = query(
        collection(db, 'user_notes'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribeNotes = onSnapshot(
        notesQuery, 
        (snapshot) => {
          const fetchedNotes: Note[] = [];
          snapshot.forEach((doc) => {
            fetchedNotes.push({ id: doc.id, ...doc.data() } as Note);
          });
          setNotes(fetchedNotes);
        },
        (error) => {
          console.error('Error listening to notes:', error);
          // Silently fail - don't crash the app
        }
      );

      return () => {
        unsubscribeTasks();
        unsubscribeNotes();
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

      // Fetch CSR projects (all approved projects can be considered CSR opportunities)
      const projectsQuery = query(
        collection(db, 'project_submissions'),
        where('status', '==', 'approved'),
        where('isVisible', '==', true),
        orderBy('submittedAt', 'desc')
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const allProjects: ProjectSubmission[] = [];
      projectsSnapshot.forEach((doc) => {
        allProjects.push({ id: doc.id, ...doc.data() } as ProjectSubmission);
      });

      // Filter CSR projects (education, technology, community development)
      const csrCategories = ['Education', 'Technology', 'Community Development', 'Youth Empowerment', 'Skills Training'];
      const csrOpportunities = allProjects.filter(p => 
        csrCategories.some(cat => p.category.toLowerCase().includes(cat.toLowerCase()))
      ).slice(0, 6);
      setCsrProjects(csrOpportunities);

      // Calculate user's participation
      const userProjects = allProjects.filter(p => 
        p.participantIds?.includes(currentUser.uid) || p.submittedBy === currentUser.uid
      );

      // Fetch events
      const eventsQuery = query(
        collection(db, 'event_submissions'),
        where('status', '==', 'approved'),
        where('isVisible', '==', true)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const allEvents: EventSubmission[] = [];
      eventsSnapshot.forEach((doc) => {
        allEvents.push({ id: doc.id, ...doc.data() } as EventSubmission);
      });

      const userEvents = allEvents.filter(e => 
        e.attendeeIds?.includes(currentUser.uid) || e.submittedBy === currentUser.uid
      );

      // Calculate stats
      const totalHours = [...userProjects, ...userEvents].reduce((sum, item) => {
        return sum + ((item as any).durationHours || 2);
      }, 0);

      const impactScore = 
        (userProjects.length * 10) + 
        (userEvents.length * 5) + 
        Math.floor(totalHours / 2);

      setStats({
        projectsJoined: userProjects.length,
        eventsAttended: userEvents.length,
        hoursVolunteered: Math.round(totalHours),
        impactScore
      });

      // Calculate skill progress based on user's skills and projects
      const userSkills = userData?.skills || [];
      const skillProgressData: SkillProgress[] = userSkills.map(skill => {
        const projectsWithSkill = userProjects.filter(p => 
          p.requiredSkills?.includes(skill) || p.preferredSkills?.includes(skill)
        ).length;
        
        // Simple level calculation: 20 points per project, max 100
        const level = Math.min(projectsWithSkill * 20, 100);
        
        return {
          skill,
          level,
          projects: projectsWithSkill
        };
      });
      setSkillProgress(skillProgressData);

      // Count potential certificates (completed projects with certificates)
      const completedWithCerts = userProjects.filter(p => 
        p.status === 'completed' && p.perks?.some(perk => perk.toLowerCase().includes('certificate'))
      ).length;
      setCertificates(completedWithCerts);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (text: string, projectId?: string) => {
    if (!currentUser) return;
    
    try {
      const project = csrProjects.find(p => p.id === projectId);
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
      const project = csrProjects.find(p => p.id === projectId);
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
          <h1 className="text-3xl sm:text-4xl font-bold text-logo-navy mb-2 flex items-center gap-3">
            <GraduationCap className="w-10 h-10 text-vibrant-orange" />
            Welcome, {userData?.displayName || 'Student'}! 🎓
          </h1>
          <p className="text-lg text-gray-600">Build your portfolio and develop valuable skills</p>
        </div>

        {/* Impact Summary */}
        <div className="mb-8">
          <ImpactSummary stats={stats} themeColor={currentTheme.colors.primary} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* CSR Project Opportunities */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-logo-navy">CSR Project Opportunities</h2>
                <Link to="/projects" className="text-vibrant-orange hover:text-vibrant-orange-dark text-sm font-medium">
                  View All
                </Link>
              </div>
              
              {csrProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {csrProjects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block p-4 border-2 border-gray-200 rounded-lg hover:border-vibrant-orange transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-logo-navy text-sm">{project.title}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {project.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{project.description}</p>
                      {project.requiredSkills && project.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.requiredSkills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No CSR opportunities available right now</p>
                  <Link to="/projects" className="btn-luxury-primary inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Browse Projects
                  </Link>
                </div>
              )}
            </div>

            {/* Skill Development Tracking */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-logo-navy mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-vibrant-orange" />
                Skill Development
              </h2>
              
              {skillProgress.length > 0 ? (
                <div className="space-y-4">
                  {skillProgress.map((skill, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-logo-navy">{skill.skill}</span>
                        <span className="text-xs text-gray-600">{skill.projects} projects</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${skill.level}%`,
                            backgroundColor: currentTheme.colors.primary
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Add skills to your profile to track development</p>
                  <Link to="/volunteer" className="btn-luxury-primary inline-flex items-center gap-2">
                    Add Skills
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
            {/* Achievement Showcase */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-logo-navy mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Achievements
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.projectsJoined}</div>
                  <div className="text-sm text-gray-600">Projects Completed</div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{stats.hoursVolunteered}</div>
                  <div className="text-sm text-gray-600">Volunteer Hours</div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">{certificates}</div>
                  <div className="text-sm text-gray-600">Certificates Earned</div>
                </div>
              </div>
            </div>

            {/* Certificate Requests */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-logo-navy mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-vibrant-orange" />
                Certificates
              </h3>
              {certificates > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    You have {certificates} certificate{certificates !== 1 ? 's' : ''} available for download.
                  </p>
                  <button className="w-full px-4 py-2 bg-vibrant-orange text-white rounded-lg hover:bg-vibrant-orange-dark transition-colors">
                    View Certificates
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">
                  Complete projects to earn certificates
                </p>
              )}
            </div>

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
                      <div className="font-semibold text-logo-navy">Find CSR Projects</div>
                      <div className="text-xs text-gray-600">Build your portfolio</div>
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
                      <div className="font-semibold text-logo-navy">Attend Events</div>
                      <div className="text-xs text-gray-600">Network and learn</div>
                    </div>
                  </div>
                </Link>
                <Link
                  to="/volunteer"
                  className="block p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-semibold text-logo-navy">Update Skills</div>
                      <div className="text-xs text-gray-600">Manage your profile</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
