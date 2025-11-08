import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, LogIn, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../hooks/useContent';
import AdminPanel from './AdminPanel';
import ContentEditor from './ContentEditor';
import EditButton from './EditButton';
import AuthModal from './AuthModal';

const EditableHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const { currentUser, userData, isGuest, isAdmin, logout } = useAuth();

  const { data: headerData, upsertContent: saveHeader } = useContent('header_content', 'main');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const defaultHeader = {
    arabicName: 'وسیلہ',
    englishName: 'Wasilah',
    logoUrl: '/logo.jpeg'
  };

  const header = headerData || defaultHeader;

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'About Us', href: '/about' },
    { name: 'Projects', href: '/projects' },
    { name: 'Events', href: '/events' },
    { name: 'Join Us', href: '/volunteer' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        isScrolled
          ? 'bg-logo-navy/98 shadow-luxury-lg backdrop-blur-luxury'
          : 'bg-logo-navy/95'
      }`}>
        {isAdmin && (
          <EditButton onClick={() => setEditingSection('header')} />
        )}

        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <Link to="/" className="flex items-center space-x-3 sm:space-x-5 lg:space-x-6 group">
              <div className="transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                <img
                  src={header.logoUrl}
                  alt="Wasilah Logo"
                  className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-cover rounded-2xl shadow-luxury-glow ring-2 ring-logo-teal/30"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base lg:text-xl font-arabic text-cream-elegant leading-tight">
                  {header.arabicName}
                </span>
                <span className="text-xl sm:text-2xl lg:text-3xl font-luxury-heading text-cream-elegant font-bold group-hover:text-vibrant-orange-light transition-colors duration-300">
                  {header.englishName}
                </span>
              </div>
            </Link>

            {/* FIXED: Desktop Navigation with proper visibility */}
            <div className="hidden lg:flex items-center space-x-2">
              {navigation.map((item) => (
                (item.name === 'Dashboard' && (isGuest || !currentUser)) ? null : (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-4 py-2.5 rounded-lg font-luxury-semibold text-sm transition-all duration-300 ${
                      location.pathname === item.href
                        ? 'bg-vibrant-orange text-cream-elegant shadow-lg'
                        : 'text-cream-elegant hover:bg-logo-teal hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
              {/* Auth actions in the main menu (desktop) */}
              {currentUser && !isGuest ? (
                <button 
                  onClick={logout} 
                  className="px-4 py-2.5 rounded-lg font-luxury-semibold text-sm text-cream-elegant hover:bg-logo-navy-light hover:text-vibrant-orange-light transition-all duration-300 border border-cream-elegant/30"
                >
                  Sign Out
                </button>
              ) : (
                <button 
                  onClick={() => setShowAuthModal(true)} 
                  className="px-5 py-2.5 rounded-lg font-luxury-semibold text-sm bg-vibrant-orange text-cream-elegant hover:bg-vibrant-orange-light transition-all duration-300 shadow-lg"
                >
                  Sign In
                </button>
              )}
            </div>

            <div className="hidden lg:block relative">
              {currentUser && !isGuest ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-3 rounded-luxury hover:bg-logo-navy-light/60 transition-colors"
                  >
                    {userData?.photoURL ? (
                      <img
                        src={userData.photoURL}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-vibrant-orange"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-vibrant-orange rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-cream-elegant font-luxury-semibold text-sm">
                        {userData?.displayName || 'User'}
                      </p>
                      {isAdmin && (
                        <p className="text-vibrant-orange-light text-xs">Admin</p>
                      )}
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-logo-navy-light rounded-luxury-lg border-2 border-vibrant-orange/30 py-2 shadow-2xl">
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setShowAdminPanel(true);
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-cream-elegant hover:bg-vibrant-orange/20 transition-colors flex items-center"
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Admin Panel
                        </button>
                      )}
                      <Link
                        to="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-4 py-2 text-cream-elegant hover:bg-vibrant-orange/20 transition-colors flex items-center"
                      >
                        <User className="w-4 h-4 mr-3" />
                        My Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-cream-elegant hover:bg-vibrant-orange/20 transition-colors flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : isGuest ? (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-vibrant-orange text-cream-elegant rounded-luxury hover:bg-vibrant-orange-light transition-colors font-luxury-semibold shadow-lg"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              ) : null}
            </div>

            {/* FIXED: Mobile menu button with better contrast */}
            <div className="flex lg:hidden items-center gap-2">
              {currentUser && !isGuest && (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="relative p-2.5 text-cream-elegant hover:text-vibrant-orange-light transition-colors active:scale-95 transform duration-200"
                >
                  <User className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2.5 rounded-lg text-cream-elegant bg-logo-navy-light/60 hover:bg-logo-teal transition-all duration-300 active:scale-95 transform border border-cream-elegant/30"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* FIXED: Mobile menu with better visibility */}
          {isMenuOpen && (
            <div className="lg:hidden animate-fade-in-down">
              <div className="px-4 pt-4 pb-6 space-y-2 bg-logo-navy-light rounded-2xl mt-4 border-2 border-logo-teal/50 shadow-2xl">
                {navigation.map((item, index) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-5 py-3.5 rounded-xl text-base font-bold transition-all duration-300 transform active:scale-95 ${
                      location.pathname === item.href
                        ? 'text-white bg-vibrant-orange shadow-md'
                        : 'text-cream-elegant hover:text-white hover:bg-logo-teal hover:translate-x-2'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {item.name}
                  </Link>
                ))}

                {isAdmin && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <button
                      onClick={() => { setShowAdminPanel(true); setIsMenuOpen(false); }}
                      className="w-full block px-6 py-4 rounded-luxury text-base font-luxury-semibold bg-vibrant-orange text-white hover:bg-vibrant-orange-light transition-colors shadow-lg"
                    >
                      Open Admin Panel
                    </button>
                  </div>
                )}

                {/* Auth actions (mobile) */}
                <div className="mt-4 pt-4 border-t border-white/20">
                  {currentUser && !isGuest ? (
                    <button
                      onClick={() => { logout(); setIsMenuOpen(false); }}
                      className="w-full block px-6 py-4 rounded-luxury text-base font-luxury-semibold bg-logo-navy-light/60 text-cream-elegant hover:bg-vibrant-orange/30 transition-colors border border-cream-elegant/30"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <button
                      onClick={() => { setShowAuthModal(true); setIsMenuOpen(false); }}
                      className="w-full block px-6 py-4 rounded-luxury text-base font-luxury-semibold bg-vibrant-orange text-white hover:bg-vibrant-orange-light transition-colors shadow-lg"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>

        <AdminPanel
          isOpen={showAdminPanel}
          onClose={() => setShowAdminPanel(false)}
        />
      </header>

      <ContentEditor
        isOpen={editingSection === 'header'}
        onClose={() => setEditingSection(null)}
        title="Edit Header"
        fields={[
          { name: 'arabicName', label: 'Arabic Name', type: 'text', required: true },
          { name: 'englishName', label: 'English Name', type: 'text', required: true },
          { name: 'logoUrl', label: 'Logo Image URL', type: 'text', required: true }
        ]}
        initialData={header}
        onSave={(data) => saveHeader('main', data)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default EditableHeader;