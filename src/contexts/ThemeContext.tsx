import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textLight: string;
  };
  preview: string;
  // When true, we apply the global `.theme-dark` class for scoped overrides
  isDark?: boolean;
  // Special theme features
  hasHeroVideo?: boolean;
  hasSectionBackgrounds?: boolean;
  isSpecial?: boolean;
}

export const themes: Theme[] = [
  {
    id: 'jet-black',
    name: 'Jet Black',
    description: 'Sleek dark UI with navy accents',
    colors: {
      // Accent/link blue inspired by GitHub
      primary: '#1f6feb',
      // Deep navy/raised surface
      secondary: '#161b22',
      // Lighter blue for hovers/gradients
      accent: '#388bfd',
      // App background
      background: '#0d1117',
      // Cards/surfaces
      surface: '#161b22',
      // Primary text
      text: '#c9d1d9',
      // Muted text
      textLight: '#8b949e'
    },
    preview: 'linear-gradient(135deg, #0d1117, #161b22)',
    isDark: true
  },
  {
    id: 'wasilah-classic',
    name: 'Wasilah Classic',
    description: 'Premium Firebase-inspired dark theme with vibrant gradients',
    colors: {
      // Vibrant gradient primary (purple-pink-orange blend)
      primary: '#FF6B9D',
      // Deep charcoal/black background
      secondary: '#0F0F23',
      // Bright accent (electric blue/cyan)
      accent: '#00D9FF',
      // Rich dark background
      background: '#050517',
      // Card/surface dark navy
      surface: '#1A1A2E',
      // Light text for dark BG
      text: '#FFFFFF',
      // Muted light text
      textLight: '#B4B4C8'
    },
    preview: 'linear-gradient(135deg, #FF6B9D, #00D9FF, #8B5CF6)',
    isDark: true
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Forest',
    description: 'Fresh green theme for environmental projects',
    colors: {
      primary: '#10B981',
      secondary: '#064E3B',
      accent: '#34D399',
      background: '#F0FDF4',
      surface: '#FFFFFF',
      text: '#1F2937',
      textLight: '#6B7280'
    },
    preview: 'linear-gradient(135deg, #10B981, #064E3B)'
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Calming blue theme for health and wellness',
    colors: {
      primary: '#3B82F6',
      secondary: '#1E3A8A',
      accent: '#60A5FA',
      background: '#F0F9FF',
      surface: '#FFFFFF',
      text: '#1F2937',
      textLight: '#6B7280'
    },
    preview: 'linear-gradient(135deg, #3B82F6, #1E3A8A)'
  },
  {
    id: 'sunset-warmth',
    name: 'Sunset Warmth',
    description: 'Warm sunset colors for community connection',
    colors: {
      primary: '#F59E0B',
      secondary: '#92400E',
      accent: '#FBBF24',
      background: '#FFFBEB',
      surface: '#FFFFFF',
      text: '#1F2937',
      textLight: '#6B7280'
    },
    preview: 'linear-gradient(135deg, #F59E0B, #92400E)'
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Elegant purple theme for education and growth',
    colors: {
      primary: '#8B5CF6',
      secondary: '#5B21B6',
      accent: '#A78BFA',
      background: '#FAF5FF',
      surface: '#FFFFFF',
      text: '#1F2937',
      textLight: '#6B7280'
    },
    preview: 'linear-gradient(135deg, #8B5CF6, #5B21B6)'
  },
  {
    id: 'rose-garden',
    name: 'Rose Garden',
    description: 'Soft rose theme for compassionate service',
    colors: {
      primary: '#F43F5E',
      secondary: '#BE185D',
      accent: '#FB7185',
      background: '#FFF1F2',
      surface: '#FFFFFF',
      text: '#1F2937',
      textLight: '#6B7280'
    },
    preview: 'linear-gradient(135deg, #F43F5E, #BE185D)'
  },
  {
    id: 'wasillah-special',
    name: 'Wasillah Special',
    description: 'Emotional community service theme with hero videos and section backgrounds',
    colors: {
      // Warm, emotional primary (coral-orange)
      primary: '#FF7B54',
      // Deep warm brown for depth
      secondary: '#8B4513',
      // Bright hopeful accent (golden yellow)
      accent: '#FFB347',
      // Soft cream background
      background: '#FFF8F0',
      // Warm white surface
      surface: '#FFFFFF',
      // Rich dark text
      text: '#2C1810',
      // Warm muted text
      textLight: '#8B7355'
    },
    preview: 'linear-gradient(135deg, #FF7B54, #FFB347, #8B4513)',
    hasHeroVideo: true,
    hasSectionBackgrounds: true,
    isSpecial: true
  }
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const defaultTheme = themes.find(t => t.id === 'wasilah-classic') || themes[0];
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const { currentUser, userData } = useAuth();

  useEffect(() => {
    // Load user's saved theme
    if (userData?.preferences?.theme) {
      const savedTheme = themes.find(t => t.id === userData.preferences.theme);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
        applyTheme(savedTheme);
      }
    }
  }, [userData]);

  // Apply the default theme on first mount as well
  useEffect(() => {
    applyTheme(currentTheme);
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-light', theme.colors.textLight);

    // Toggle dark class for scoped CSS overrides
    if (theme.isDark) {
      root.classList.add('theme-dark');
    } else {
      root.classList.remove('theme-dark');
    }
  };

  const setTheme = async (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    setCurrentTheme(theme);
    applyTheme(theme);

    // Save to user preferences
    if (currentUser && userData && !userData.isGuest) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          'preferences.theme': themeId,
          'preferences.lastUpdated': new Date()
        });
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };

  const value: ThemeContextType = {
    currentTheme,
    setTheme,
    themes
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};