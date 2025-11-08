import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useActivityLogger = () => {
  const location = useLocation();
  const { logActivity, currentUser, isGuest } = useAuth();

  useEffect(() => {
    if (currentUser && !isGuest) {
      logActivity('page_visit', location.pathname, {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    }
  }, [location.pathname, currentUser, isGuest, logActivity]);

  const logCustomActivity = (action: string, details?: any) => {
    if (currentUser && !isGuest) {
      logActivity(action, location.pathname, details);
    }
  };

  return { logCustomActivity };
};