import React, { useState } from 'react';
import { Plus, Trash2, Bell, Calendar, Clock, Mail, CheckCircle } from 'lucide-react';
import { Reminder } from '../types/submissions';

interface ReminderManagerProps {
  reminders: Reminder[];
  onChange: (reminders: Reminder[]) => void;
  defaultEmail?: string;
}

export default function ReminderManager({
  reminders,
  onChange,
  defaultEmail = '',
}: ReminderManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    description: '',
    reminderDate: '',
    reminderTime: '',
    notifyEmails: defaultEmail ? [defaultEmail] : [],
  });
  const [emailInput, setEmailInput] = useState('');

  const addReminder = () => {
    if (
      newReminder.title?.trim() &&
      newReminder.reminderDate &&
      newReminder.reminderTime &&
      newReminder.notifyEmails &&
      newReminder.notifyEmails.length > 0
    ) {
      const reminder: Reminder = {
        id: crypto.randomUUID(),
        title: newReminder.title.trim(),
        description: newReminder.description?.trim(),
        reminderDate: newReminder.reminderDate,
        reminderTime: newReminder.reminderTime,
        notifyEmails: newReminder.notifyEmails,
        sent: false,
      };
      onChange([...reminders, reminder]);
      setNewReminder({
        title: '',
        description: '',
        reminderDate: '',
        reminderTime: '',
        notifyEmails: defaultEmail ? [defaultEmail] : [],
      });
      setEmailInput('');
      setIsAdding(false);
    }
  };

  const deleteReminder = (id: string) => {
    onChange(reminders.filter((reminder) => reminder.id !== id));
  };

  const addEmail = () => {
    if (emailInput.trim() && emailInput.includes('@')) {
      setNewReminder({
        ...newReminder,
        notifyEmails: [...(newReminder.notifyEmails || []), emailInput.trim()],
      });
      setEmailInput('');
    }
  };

  const removeEmail = (email: string) => {
    setNewReminder({
      ...newReminder,
      notifyEmails: (newReminder.notifyEmails || []).filter((e) => e !== email),
    });
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateObj = new Date(`${date}T${time}`);
      return dateObj.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return `${date} at ${time}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <Bell className="w-5 h-5" />
          <span className="font-medium">Reminders</span>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Reminder
          </button>
        )}
      </div>

      {isAdding && (
        <div className="p-4 border-2 border-orange-200 rounded-lg bg-orange-50 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder Title
            </label>
            <input
              type="text"
              value={newReminder.title || ''}
              onChange={(e) =>
                setNewReminder({ ...newReminder, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., Registration deadline approaching"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={newReminder.description || ''}
              onChange={(e) =>
                setNewReminder({ ...newReminder, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Additional details about this reminder"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={newReminder.reminderDate || ''}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      reminderDate: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="time"
                  value={newReminder.reminderTime || ''}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      reminderTime: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Emails
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="email@example.com"
              />
              <button
                type="button"
                onClick={addEmail}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Add
              </button>
            </div>
            {newReminder.notifyEmails && newReminder.notifyEmails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newReminder.notifyEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm"
                  >
                    <Mail className="w-3 h-3 text-gray-500" />
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewReminder({
                  title: '',
                  description: '',
                  reminderDate: '',
                  reminderTime: '',
                  notifyEmails: defaultEmail ? [defaultEmail] : [],
                });
                setEmailInput('');
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addReminder}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Save Reminder
            </button>
          </div>
        </div>
      )}

      {reminders.length > 0 ? (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {reminder.sent ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Bell className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    )}
                    <h4 className="font-medium text-gray-900">
                      {reminder.title}
                    </h4>
                    {reminder.sent && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Sent
                      </span>
                    )}
                  </div>

                  {reminder.description && (
                    <p className="text-sm text-gray-600 ml-7">
                      {reminder.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500 ml-7">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatDateTime(
                          reminder.reminderDate,
                          reminder.reminderTime
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{reminder.notifyEmails.length} recipients</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteReminder(reminder.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isAdding && (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            No reminders set. Add reminders to stay notified about important
            dates.
          </div>
        )
      )}
    </div>
  );
}
