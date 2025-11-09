import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Heart, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AdminPanel from './AdminPanel';
import NotificationBell from './NotificationBell';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const location = useLocation();
  const { currentUser, userData, isGuest, isAdmin, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
      isScrolled 
        ? 'luxury-glass-dark shadow-luxury-lg backdrop-blur-luxury' 
        : 'bg-transparent'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo with Urdu and English - Enhanced Integration */}
          <Link to="/" className="logo-badge group">
            <div className="relative transform transition-transform duration-500 group-hover:scale-110">
              <img
                src="/logo.jpeg"
                alt="Wasilah Logo"
                className="w-14 h-14 object-contain rounded-xl filter drop-shadow-lg"
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-vibrant-orange to-vibrant-orange-light rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-arabic text-cream-elegant leading-tight group-hover:text-vibrant-orange-light transition-colors">
                وسیلہ
              </span>
              <span className="text-xl font-luxury-heading text-cream-elegant group-hover:text-vibrant-orange-light transition-colors duration-300">
                Wasilah
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Pill Style */}
          <div className="hidden lg:flex items-center space-x-2">
            {navigation.map((item) => (
              // Only show Dashboard for authenticated users
              (item.name === 'Dashboard' && (isGuest || !currentUser)) ? null : (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-pill ${
                    location.pathname === item.href ? 'active' : ''
                  }`}
                >
                  {item.name}
                </Link>
              )
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden lg:flex items-center space-x-3">
            {currentUser && !isGuest && <NotificationBell />}
            <div className="relative">
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
                    <div className="absolute right-0 top-full mt-2 w-48 luxury-glass-dark rounded-luxury-lg border-2 border-vibrant-orange/30 py-2">
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
                <div className="text-cream-elegant font-luxury-body">
                  <span className="text-sm opacity-75">Guest User</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-4 rounded-luxury text-cream-elegant hover:bg-logo-navy-light/60 transition-all duration-300"
            >
              {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="px-6 pt-6 pb-8 space-y-3 luxury-glass-dark rounded-luxury-lg mt-6 border-2 border-vibrant-orange/30">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`w-full inline-flex items-center px-6 py-4 rounded-luxury ${
                    location.pathname === item.href
                      ? 'btn-luxury-primary'
                      : 'btn-luxury-secondary'
                  } justify-start text-base`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <AdminPanel 
        isOpen={showAdminPanel} 
        onClose={() => setShowAdminPanel(false)} 
      />
    </header>
  );
};

export default Header;