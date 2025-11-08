import React, { useState } from 'react';
import { Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { createReminder } from '../services/reminderService';
import { useAuth } from '../contexts/AuthContext';

interface ReminderFormProps {
  projectName?: string;
  onSuccess?: () => void;
}

export const ReminderForm: React.FC<ReminderFormProps> = ({ 
  projectName: initialProjectName = '',
  onSuccess 
}) => {
  const { currentUser, userData } = useAuth();
  const [formData, setFormData] = useState({
    email: userData?.email || '',
    name: userData?.displayName || '',
    projectName: initialProjectName,
    message: '',
    scheduledDate: '',
    scheduledTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate form
      if (!formData.email || !formData.name || !formData.projectName || 
          !formData.message || !formData.scheduledDate || !formData.scheduledTime) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      // Combine date and time into ISO timestamp
      const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();

      // Create the reminder
      const result = await createReminder({
        email: formData.email,
        name: formData.name,
        projectName: formData.projectName,
        message: formData.message,
        scheduledAt,
        userId: currentUser?.uid
      });

      if (result.success) {
        setSuccess(true);
        // Reset message and datetime fields
        setFormData(prev => ({
          ...prev,
          message: '',
          scheduledDate: '',
          scheduledTime: ''
        }));
        
        if (onSuccess) {
          setTimeout(() => onSuccess(), 2000);
        }
      } else {
        setError(result.error || 'Failed to create reminder');
      }
    } catch (err) {
      console.error('Error creating reminder:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-xl">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Set a Reminder</h2>
          <p className="text-gray-600 text-sm">Get notified at the perfect time</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="john@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="projectName" className="block text-sm font-semibold text-gray-700 mb-2">
            Project/Event Name
          </label>
          <input
            type="text"
            id="projectName"
            name="projectName"
            value={formData.projectName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            placeholder="Community Cleanup Drive"
            required
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
            Reminder Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
            placeholder="Don't forget to bring cleaning supplies and wear comfortable clothes..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-semibold text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              id="scheduledDate"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleInputChange}
              min={today}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="scheduledTime" className="block text-sm font-semibold text-gray-700 mb-2">
              Time
            </label>
            <input
              type="time"
              id="scheduledTime"
              name="scheduledTime"
              value={formData.scheduledTime}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">Reminder set successfully! You'll receive an email at the scheduled time.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating Reminder...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Set Reminder</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ReminderForm;
