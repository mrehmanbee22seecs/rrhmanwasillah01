import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AdminPanel from './AdminPanel';

const AdminToggle: React.FC = () => {
  const { isAdmin } = useAuth();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  if (!isAdmin) return null;

  return (
    <>
      {/* Z-INDEX: 60 - Admin controls (above floating buttons at 50) */}
      {/* Mobile: bottom-20 left-4 (below DonationWidget at bottom-32) */}
      {/* Desktop: bottom-6 left-6 (standard positioning) */}
      <button
        onClick={() => setShowAdminPanel(true)}
        className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-[66] px-3 py-2 sm:px-6 sm:py-3 rounded-full shadow-lg font-bold transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
        title="Open Admin Panel"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Settings className="w-5 h-5 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-base font-bold">ADMIN</span>
        </div>
      </button>

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <AdminPanel
          isOpen={showAdminPanel}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </>
  );
};

export default AdminToggle;
