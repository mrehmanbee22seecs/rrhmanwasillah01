import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface AdminContextType {
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  canEdit: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setIsAdminMode(false);
    }
  }, [isAdmin]);

  const toggleAdminMode = () => {
    if (isAdmin) {
      setIsAdminMode(prev => !prev);
    }
  };

  const canEdit = isAdmin && isAdminMode;

  return (
    <AdminContext.Provider value={{ isAdminMode, toggleAdminMode, canEdit }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};
