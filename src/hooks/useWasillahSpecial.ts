import { useTheme } from '../contexts/ThemeContext';
import { wasillahSpecialMedia } from '../config/wasillahSpecialMedia';
import { useLocation } from 'react-router-dom';

/**
 * Hook to manage Wasillah Special theme features
 * Returns hero video and section backgrounds based on current page
 */
export const useWasillahSpecial = () => {
  const { currentTheme } = useTheme();
  const location = useLocation();

  const isWasillahSpecial = currentTheme.id === 'wasillah-special';

  // Determine current page from pathname
  const getCurrentPage = (): string => {
    const path = location.pathname.split('/')[1] || 'home';
    return path;
  };

  const currentPage = getCurrentPage();

  // Get hero video for current page
  const getHeroVideo = () => {
    if (!isWasillahSpecial || !currentTheme.hasHeroVideo) return null;

    const pageVideos = wasillahSpecialMedia.heroVideos;
    const videoKey = currentPage as keyof typeof pageVideos;

    return pageVideos[videoKey] || pageVideos.home;
  };

  // Get section background image
  const getSectionBackground = (sectionType: keyof typeof wasillahSpecialMedia.sectionBackgrounds) => {
    if (!isWasillahSpecial || !currentTheme.hasSectionBackgrounds) return null;

    return wasillahSpecialMedia.sectionBackgrounds[sectionType];
  };

  // Get all available section backgrounds
  const getAllSectionBackgrounds = () => {
    if (!isWasillahSpecial || !currentTheme.hasSectionBackgrounds) return [];

    return Object.entries(wasillahSpecialMedia.sectionBackgrounds).map(([key, value]) => ({
      key,
      ...value
    }));
  };

  return {
    isWasillahSpecial,
    hasHeroVideo: isWasillahSpecial && currentTheme.hasHeroVideo,
    hasSectionBackgrounds: isWasillahSpecial && currentTheme.hasSectionBackgrounds,
    currentPage,
    heroVideo: getHeroVideo(),
    getSectionBackground,
    getAllSectionBackgrounds
  };
};
