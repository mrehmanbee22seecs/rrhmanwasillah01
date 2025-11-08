import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ProjectApplicationEntry, EventRegistrationEntry } from '../types/submissions';
import { Edit, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import EditApplicationModal from '../components/EditApplicationModal';
import EditRegistrationModal from '../components/EditRegistrationModal';

const MyApplications: React.FC = () => {
  const { currentUser } = useAuth();
  const [projectApplications, setProjectApplications] = useState<ProjectApplicationEntry[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistrationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingApplication, setEditingApplication] = useState<ProjectApplicationEntry | null>(null);
  const [editingRegistration, setEditingRegistration] = useState<EventRegistrationEntry | null>(null);

  useEffect(() => {
    if (currentUser?.email) {
      fetchMyApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchMyApplications = async () => {
    if (!currentUser?.email) return;
    
    setLoading(true);
    try {
      // Fetch project applications
      const projQ = query(
        collection(db, 'project_applications'),
        where('email', '==', currentUser.email),
        orderBy('submittedAt', 'desc')
      );
      const projSnap = await getDocs(projQ);
      const projApps: ProjectApplicationEntry[] = [];
      projSnap.forEach((doc) => {
        projApps.push({ id: doc.id, ...doc.data() } as ProjectApplicationEntry);
      });
      setProjectApplications(projApps);

      // Fetch event registrations
      const evtQ = query(
        collection(db, 'event_registrations'),
        where('email', '==', currentUser.email),
        orderBy('submittedAt', 'desc')
      );
      const evtSnap = await getDocs(evtQ);
      const evtRegs: EventRegistrationEntry[] = [];
      evtSnap.forEach((doc) => {
        evtRegs.push({ id: doc.id, ...doc.data() } as EventRegistrationEntry);
      });
      setEventRegistrations(evtRegs);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: unknown) => {
    if (!ts) return 'N/A';
    try {
      if (typeof ts?.toDate === 'function') return ts.toDate().toLocaleString();
      if (typeof ts === 'string') return new Date(ts).toLocaleString();
      return 'N/A';
    } catch {
      return 'N/A';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-cream-elegant py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="luxury-card bg-cream-white p-8 text-center">
            <h2 className="text-2xl font-luxury-heading text-black mb-4">Sign In Required</h2>
            <p className="text-black mb-6">Please sign in to view your applications and registrations.</p>
            <Link to="/dashboard" className="btn-luxury-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-elegant py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto mb-4"></div>
            <p className="text-xl font-luxury-heading text-black">Loading your applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-elegant py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-luxury-display text-black mb-8">My Applications & Registrations</h1>

        {/* Project Applications */}
        <section className="mb-12">
          <h2 className="text-2xl font-luxury-heading text-black mb-6">Project Applications</h2>
          {projectApplications.length === 0 ? (
            <div className="luxury-card bg-cream-white p-8 text-center">
              <p className="text-black">You haven't applied to any projects yet.</p>
              <Link to="/projects" className="btn-luxury-primary mt-4 inline-block">
                Browse Projects
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projectApplications.map((app) => (
                <div key={app.id} className="luxury-card bg-cream-white p-6 hover:shadow-luxury-lg transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-luxury-heading text-black mb-2">{app.projectTitle}</h3>
                      <div className="flex items-center text-black/70 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-sm">Applied: {formatTimestamp(app.submittedAt)}</span>
                      </div>
                      {app.preferredRole && (
                        <div className="flex items-center text-black/70 mb-2">
                          <CheckCircle className="w-4 h-4 mr-2 text-vibrant-orange" />
                          <span className="text-sm">Role: {app.preferredRole}</span>
                        </div>
                      )}
                      {app.availability && (
                        <div className="text-sm text-black/70">
                          Availability: {app.availability}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingApplication(app)}
                      className="flex items-center px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-dark transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Event Registrations */}
        <section>
          <h2 className="text-2xl font-luxury-heading text-black mb-6">Event Registrations</h2>
          {eventRegistrations.length === 0 ? (
            <div className="luxury-card bg-cream-white p-8 text-center">
              <p className="text-black">You haven't registered for any events yet.</p>
              <Link to="/events" className="btn-luxury-primary mt-4 inline-block">
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {eventRegistrations.map((reg) => (
                <div key={reg.id} className="luxury-card bg-cream-white p-6 hover:shadow-luxury-lg transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-luxury-heading text-black mb-2">{reg.eventTitle}</h3>
                      <div className="flex items-center text-black/70 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-sm">Event Date: {reg.eventDate || 'TBA'}</span>
                      </div>
                      <div className="flex items-center text-black/70 mb-2">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-sm">Registered: {formatTimestamp(reg.submittedAt)}</span>
                      </div>
                      {reg.shiftPreference && (
                        <div className="text-sm text-black/70">
                          Shift: {reg.shiftPreference}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingRegistration(reg)}
                      className="flex items-center px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-dark transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Edit Application Modal */}
        {editingApplication && (
          <EditApplicationModal
            application={editingApplication}
            onClose={() => setEditingApplication(null)}
            onSuccess={() => {
              setEditingApplication(null);
              fetchMyApplications();
            }}
          />
        )}

        {/* Edit Registration Modal */}
        {editingRegistration && (
          <EditRegistrationModal
            registration={editingRegistration}
            onClose={() => setEditingRegistration(null)}
            onSuccess={() => {
              setEditingRegistration(null);
              fetchMyApplications();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MyApplications;
