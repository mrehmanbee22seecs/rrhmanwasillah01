import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Clock, Calendar, Mail, Send, CheckCircle, AlertCircle, Edit2, X } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface Reminder {
  id: string;
  name: string;
  email: string;
  projectName: string;
  message: string;
  scheduledAt: any;
  sent: boolean;
  sentAt?: any;
  createdAt: any;
  userId: string;
}

const RemindersPanel = () => {
  const { currentUser, userData } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [checkingReminders, setCheckingReminders] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    projectName: '',
    message: '',
    scheduledDate: '',
    scheduledTime: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadReminders();
      // Check for due reminders periodically (every 5 minutes)
      const interval = setInterval(() => {
        checkDueReminders();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const loadReminders = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, 'reminders'),
        where('userId', '==', currentUser.uid),
        orderBy('scheduledAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const remindersList: Reminder[] = [];
      
      snapshot.forEach((doc) => {
        remindersList.push({
          id: doc.id,
          ...doc.data()
        } as Reminder);
      });

      setReminders(remindersList);
    } catch (err) {
      console.error('Error loading reminders:', err);
      setError('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const checkDueReminders = async () => {
    if (checkingReminders) return;
    
    try {
      setCheckingReminders(true);
      const functions = getFunctions();
      const checkReminders = httpsCallable(functions, 'checkDueReminders');
      await checkReminders({});
      // Reload reminders to show updated status
      await loadReminders();
    } catch (err) {
      console.error('Error checking reminders:', err);
    } finally {
      setCheckingReminders(false);
    }
  };

  const createReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userData) return;

    setError(null);
    setSuccess(null);

    try {
      // Validate form
      if (!formData.projectName || !formData.message || !formData.scheduledDate || !formData.scheduledTime) {
        setError('Please fill in all fields');
        return;
      }

      // Combine date and time
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      
      // Check if scheduled time is in the future
      if (scheduledDateTime <= new Date()) {
        setError('Scheduled time must be in the future');
        return;
      }

      // Create reminder document
      await addDoc(collection(db, 'reminders'), {
        name: userData.displayName || userData.email || 'User',
        email: userData.email || currentUser.email,
        projectName: formData.projectName,
        message: formData.message,
        scheduledAt: Timestamp.fromDate(scheduledDateTime),
        sent: false,
        createdAt: serverTimestamp(),
        userId: currentUser.uid
      });

      setSuccess('Reminder created successfully!');
      setFormData({
        projectName: '',
        message: '',
        scheduledDate: '',
        scheduledTime: '',
      });
      setShowCreateForm(false);
      await loadReminders();
    } catch (err) {
      console.error('Error creating reminder:', err);
      setError('Failed to create reminder');
    }
  };

  const updateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReminder) return;

    setError(null);
    setSuccess(null);

    try {
      // Validate form
      if (!formData.projectName || !formData.message || !formData.scheduledDate || !formData.scheduledTime) {
        setError('Please fill in all fields');
        return;
      }

      // Combine date and time
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      
      // Check if scheduled time is in the future
      if (scheduledDateTime <= new Date()) {
        setError('Scheduled time must be in the future');
        return;
      }

      // Update reminder document
      const reminderRef = doc(db, 'reminders', editingReminder.id);
      await updateDoc(reminderRef, {
        projectName: formData.projectName,
        message: formData.message,
        scheduledAt: Timestamp.fromDate(scheduledDateTime),
      });

      setSuccess('Reminder updated successfully!');
      setFormData({
        projectName: '',
        message: '',
        scheduledDate: '',
        scheduledTime: '',
      });
      setEditingReminder(null);
      await loadReminders();
    } catch (err) {
      console.error('Error updating reminder:', err);
      setError('Failed to update reminder');
    }
  };

  const deleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await deleteDoc(doc(db, 'reminders', reminderId));
      setSuccess('Reminder deleted successfully!');
      await loadReminders();
    } catch (err) {
      console.error('Error deleting reminder:', err);
      setError('Failed to delete reminder');
    }
  };

  const sendReminderNow = async (reminderId: string) => {
    if (!confirm('Send this reminder email now?')) return;

    try {
      const functions = getFunctions();
      const sendNow = httpsCallable(functions, 'sendReminderNow');
      await sendNow({ reminderId });
      setSuccess('Reminder sent successfully!');
      await loadReminders();
    } catch (err) {
      console.error('Error sending reminder:', err);
      setError('Failed to send reminder');
    }
  };

  const startEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    // Parse the scheduled time
    let scheduledDate: Date;
    if (reminder.scheduledAt?.toDate && typeof reminder.scheduledAt.toDate === 'function') {
      scheduledDate = reminder.scheduledAt.toDate();
    } else if (reminder.scheduledAt instanceof Date) {
      scheduledDate = reminder.scheduledAt;
    } else if (reminder.scheduledAt?.seconds) {
      scheduledDate = new Date(reminder.scheduledAt.seconds * 1000);
    } else {
      scheduledDate = new Date();
    }
    
    setFormData({
      projectName: reminder.projectName,
      message: reminder.message,
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      scheduledTime: scheduledDate.toTimeString().slice(0, 5),
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingReminder(null);
    setShowCreateForm(false);
    setFormData({
      projectName: '',
      message: '',
      scheduledDate: '',
      scheduledTime: '',
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return 'N/A';
    }
    
    return date.toLocaleString();
  };

  const isOverdue = (reminder: Reminder) => {
    if (reminder.sent) return false;
    
    let scheduledDate: Date;
    if (reminder.scheduledAt?.toDate && typeof reminder.scheduledAt.toDate === 'function') {
      scheduledDate = reminder.scheduledAt.toDate();
    } else if (reminder.scheduledAt instanceof Date) {
      scheduledDate = reminder.scheduledAt;
    } else if (reminder.scheduledAt?.seconds) {
      scheduledDate = new Date(reminder.scheduledAt.seconds * 1000);
    } else {
      return false;
    }
    
    return scheduledDate < new Date();
  };

  const upcomingReminders = reminders.filter(r => !r.sent && !isOverdue(r));
  const overdueReminders = reminders.filter(r => !r.sent && isOverdue(r));
  const sentReminders = reminders.filter(r => r.sent);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-7 h-7 text-pink-500" />
            My Reminders
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your project and event reminders
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
        >
          {showCreateForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showCreateForm ? 'Cancel' : 'New Reminder'}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 dark:text-green-200 font-medium">Success</p>
            <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
          </h3>
          <form onSubmit={editingReminder ? updateReminder : createReminder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project/Event Name
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Beach Cleanup Event"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reminder Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="Don't forget to bring reusable bags and gloves!"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                {editingReminder ? 'Update Reminder' : 'Create Reminder'}
              </button>
              {editingReminder && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Overdue Reminders */}
      {overdueReminders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Overdue ({overdueReminders.length})
          </h3>
          {overdueReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onDelete={deleteReminder}
              onEdit={startEdit}
              onSendNow={sendReminderNow}
              isOverdue={true}
            />
          ))}
        </div>
      )}

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-500" />
            Upcoming ({upcomingReminders.length})
          </h3>
          {upcomingReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onDelete={deleteReminder}
              onEdit={startEdit}
              onSendNow={sendReminderNow}
              isOverdue={false}
            />
          ))}
        </div>
      )}

      {/* Sent Reminders */}
      {sentReminders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Sent ({sentReminders.length})
          </h3>
          {sentReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onDelete={deleteReminder}
              onEdit={null}
              onSendNow={null}
              isOverdue={false}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {reminders.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No reminders yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first reminder to stay on top of your projects and events
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Reminder
          </button>
        </div>
      )}

      {/* Check Reminders Button */}
      {reminders.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={checkDueReminders}
            disabled={checkingReminders}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all inline-flex items-center gap-2 disabled:opacity-50"
          >
            {checkingReminders ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 dark:border-gray-300"></div>
            ) : (
              <Bell className="w-5 h-5" />
            )}
            Check for Due Reminders
          </button>
        </div>
      )}
    </div>
  );
};

// ReminderCard Component
interface ReminderCardProps {
  reminder: Reminder;
  onDelete: (id: string) => void;
  onEdit: ((reminder: Reminder) => void) | null;
  onSendNow: ((id: string) => void) | null;
  isOverdue: boolean;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onDelete, onEdit, onSendNow, isOverdue }) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        const date = timestamp.toDate();
        return date.toLocaleString();
      } else if (timestamp instanceof Date) {
        return timestamp.toLocaleString();
      } else if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString();
      }
      return 'N/A';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-2 ${
      isOverdue ? 'border-red-300 dark:border-red-700' : 
      reminder.sent ? 'border-green-300 dark:border-green-700' : 
      'border-gray-200 dark:border-gray-700'
    } shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            {reminder.projectName}
            {reminder.sent && <CheckCircle className="w-4 h-4 text-green-500" />}
            {isOverdue && <AlertCircle className="w-4 h-4 text-red-500" />}
          </h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
            {reminder.message}
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(reminder.scheduledAt)}
            </div>
            {reminder.sent && reminder.sentAt && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Mail className="w-4 h-4" />
                Sent: {formatDate(reminder.sentAt)}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!reminder.sent && onEdit && (
            <button
              onClick={() => onEdit(reminder)}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {!reminder.sent && onSendNow && (
            <button
              onClick={() => onSendNow(reminder.id)}
              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
              title="Send Now"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(reminder.id)}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemindersPanel;
