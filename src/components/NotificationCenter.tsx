/**
 * NotificationCenter Component
 * Full notification center with list, filters, and preferences
 */

import React, { useState } from 'react';
import {
  Bell,
  Check,
  X,
  Trash2,
  Settings,
  Mail,
  Smartphone,
  Clock,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { Notification, NotificationType } from '../types/notifications';
import { getNotificationIcon } from '../utils/notificationTemplates';
// Simple date formatter (replacing date-fns to avoid dependency)
function formatTimeAgo(timestamp: any): string {
  if (!timestamp) return 'Just now';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Just now';
  }
}

const NotificationCenter: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    stats,
    preferences,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotif,
    updatePreferences,
    enablePushNotifications,
  } = useNotifications({ limit: 50 });

  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);

  // Filter notifications
  React.useEffect(() => {
    let filtered = notifications;

    if (filter === 'unread') {
      filtered = filtered.filter((n) => !n.read);
    } else if (filter !== 'all') {
      filtered = filtered.filter((n) => n.type === filter);
    }

    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    if (onClose) {
      onClose();
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotif(notificationId);
  };

  const handleEnablePush = async () => {
    const enabled = await enablePushNotifications();
    if (enabled) {
      alert('Push notifications enabled!');
    } else {
      alert('Failed to enable push notifications. Please check your browser settings.');
    }
  };


  const notificationTypes: NotificationType[] = [
    'project_update',
    'application_status',
    'message',
    'reminder',
    'achievement',
    'event_reminder',
    'project_application',
    'system',
    'welcome',
  ];

  const typeLabels: Record<NotificationType, string> = {
    project_update: 'Project Updates',
    application_status: 'Applications',
    message: 'Messages',
    reminder: 'Reminders',
    achievement: 'Achievements',
    event_reminder: 'Event Reminders',
    project_application: 'Project Applications',
    system: 'System',
    welcome: 'Welcome',
  };

  if (loading) {
    return (
      <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 p-6 w-96 max-h-[600px] overflow-y-auto">
        <div className="text-cream-elegant text-center">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 w-96 max-h-[600px] flex flex-col shadow-luxury-lg">
      {/* Header */}
      <div className="p-4 border-b border-vibrant-orange/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-5 h-5 text-vibrant-orange" />
          <h3 className="text-cream-elegant font-luxury-heading text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-vibrant-orange text-white text-xs font-bold rounded-full px-2 py-1">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="p-2 rounded-luxury hover:bg-vibrant-orange/20 transition-colors"
            aria-label="Preferences"
          >
            <Settings className="w-4 h-4 text-cream-elegant" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-luxury hover:bg-vibrant-orange/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-cream-elegant" />
            </button>
          )}
        </div>
      </div>

      {/* Preferences Panel */}
      {showPreferences && (
        <div className="p-4 border-b border-vibrant-orange/30 bg-logo-navy-light/30">
          <h4 className="text-cream-elegant font-luxury-semibold mb-3">Notification Preferences</h4>
          
          {/* Push Notifications */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cream-elegant text-sm">Push Notifications</span>
              {!preferences?.push?.enabled && (
                <button
                  onClick={handleEnablePush}
                  className="btn-luxury-secondary text-xs px-3 py-1"
                >
                  Enable
                </button>
              )}
            </div>
            <div className="text-vibrant-orange-light text-xs">
              {preferences?.push?.enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          {/* Email Notifications */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cream-elegant text-sm">Email Notifications</span>
              <button
                onClick={() =>
                  updatePreferences({
                    email: {
                      ...preferences?.email,
                      enabled: !preferences?.email?.enabled,
                    },
                  })
                }
                className={`text-xs px-3 py-1 rounded-luxury ${
                  preferences?.email?.enabled
                    ? 'bg-vibrant-orange text-white'
                    : 'bg-gray-600 text-cream-elegant'
                }`}
              >
                {preferences?.email?.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>

          {/* Weekly Digest */}
          <div>
            <label className="flex items-center space-x-2 text-cream-elegant text-sm">
              <input
                type="checkbox"
                checked={preferences?.email?.weeklyDigest || false}
                onChange={(e) =>
                  updatePreferences({
                    email: {
                      ...preferences?.email,
                      weeklyDigest: e.target.checked,
                    },
                  })
                }
                className="rounded text-vibrant-orange"
              />
              <span>Weekly Email Digest</span>
            </label>
          </div>
        </div>
      )}

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="p-2 border-b border-vibrant-orange/30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-cream-elegant" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-logo-navy-light border border-vibrant-orange/30 rounded-luxury text-cream-elegant text-xs px-2 py-1"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              {notificationTypes.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center space-x-1 text-vibrant-orange-light text-xs hover:text-vibrant-orange transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-cream-elegant/60">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-vibrant-orange/10">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-logo-navy-light/40 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-logo-navy-light/20' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl flex-shrink-0">
                    {notification.icon || getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-cream-elegant font-luxury-semibold text-sm mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-cream-elegant/80 text-xs mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-2 text-cream-elegant/60 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                          {!notification.read && (
                            <span className="bg-vibrant-orange text-white text-xs px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-1 rounded-luxury hover:bg-vibrant-orange/20 transition-colors"
                            aria-label="Mark as read"
                          >
                            <Check className="w-4 h-4 text-cream-elegant" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="p-1 rounded-luxury hover:bg-vibrant-orange/20 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-cream-elegant" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-vibrant-orange/30 text-center">
          <button
            onClick={() => {
              // Navigate to full notifications page if it exists
              window.location.href = '/notifications';
            }}
            className="text-vibrant-orange-light text-xs hover:text-vibrant-orange transition-colors"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

