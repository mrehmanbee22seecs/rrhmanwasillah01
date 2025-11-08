import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Admin-only button to migrate existing submissions
 * Adds participantIds/attendeeIds and durationHours to old submissions
 */

const MigrationButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const parseDurationEstimate = (estimate?: string): number => {
    if (!estimate) return 2;
    
    const lower = estimate.toLowerCase();
    const numbers = lower.match(/\d+/g);
    
    if (!numbers || numbers.length === 0) return 2;
    
    const value = parseInt(numbers[0]);
    
    if (lower.includes('hour') || lower.includes('hr')) {
      return value;
    } else if (lower.includes('day')) {
      return value * 8;
    } else if (lower.includes('week')) {
      return value * 40;
    } else if (lower.includes('month')) {
      return value * 160;
    } else if (lower.includes('minute') || lower.includes('min')) {
      return value / 60;
    }
    
    return value;
  };

  const runMigration = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      let totalUpdated = 0;

      // Migrate projects
      const projectsRef = collection(db, 'project_submissions');
      const projectsSnapshot = await getDocs(projectsRef);
      
      const projectBatch = writeBatch(db);
      let projectsUpdated = 0;
      
      projectsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const updates: any = {};
        
        if (!data.participantIds && data.submittedBy) {
          updates.participantIds = [data.submittedBy];
        }
        
        if (!data.durationHours) {
          updates.durationHours = data.durationEstimate 
            ? parseDurationEstimate(data.durationEstimate) 
            : 2;
        }
        
        if (Object.keys(updates).length > 0) {
          const docRef = doc(db, 'project_submissions', docSnapshot.id);
          projectBatch.update(docRef, updates);
          projectsUpdated++;
        }
      });
      
      if (projectsUpdated > 0) {
        await projectBatch.commit();
      }

      // Migrate events
      const eventsRef = collection(db, 'event_submissions');
      const eventsSnapshot = await getDocs(eventsRef);
      
      const eventBatch = writeBatch(db);
      let eventsUpdated = 0;
      
      eventsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const updates: any = {};
        
        if (!data.attendeeIds && data.submittedBy) {
          updates.attendeeIds = [data.submittedBy];
        }
        
        if (!data.durationHours) {
          updates.durationHours = data.durationEstimate 
            ? parseDurationEstimate(data.durationEstimate) 
            : 2;
        }
        
        if (Object.keys(updates).length > 0) {
          const docRef = doc(db, 'event_submissions', docSnapshot.id);
          eventBatch.update(docRef, updates);
          eventsUpdated++;
        }
      });
      
      if (eventsUpdated > 0) {
        await eventBatch.commit();
      }

      totalUpdated = projectsUpdated + eventsUpdated;

      setStatus('success');
      setMessage(`Migration successful! Updated ${projectsUpdated} projects and ${eventsUpdated} events.`);
      
    } catch (error) {
      console.error('Migration error:', error);
      setStatus('error');
      setMessage('Migration failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-black mb-2">
            🔄 Migrate Existing Submissions
          </h3>
          <p className="text-sm text-gray-600">
            This will update all existing submissions to work with the new stats system.
            It adds participantIds/attendeeIds and durationHours to old submissions.
          </p>
        </div>
      </div>

      <button
        onClick={runMigration}
        disabled={loading}
        className="btn-luxury-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Migrating...' : 'Run Migration'}
      </button>

      {status !== 'idle' && (
        <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
          status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {status === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{message}</p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <strong>What this does:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Adds submitter to participantIds (projects) or attendeeIds (events)</li>
          <li>Calculates durationHours from durationEstimate if missing</li>
          <li>Sets default 2 hours if no duration info available</li>
          <li>Enables accurate stats calculation for existing users</li>
        </ul>
      </div>
    </div>
  );
};

export default MigrationButton;
