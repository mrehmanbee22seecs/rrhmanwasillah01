import React from 'react';
import { useWasillahSpecial } from '../hooks/useWasillahSpecial';
import HeroVideo from './HeroVideo';

interface ThemedHeroSectionProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: string;
}

/**
 * ThemedHeroSection component
 * Automatically renders hero video for Wasillah Special theme
 * Falls back to regular hero section for other themes
 */
const ThemedHeroSection: React.FC<ThemedHeroSectionProps> = ({
  children,
  className = '',
  minHeight = 'min-h-screen'
}) => {
  const { hasHeroVideo, heroVideo } = useWasillahSpecial();

  if (hasHeroVideo && heroVideo) {
    return (
      <HeroVideo
        videoUrl={heroVideo.url}
        fallbackImage={heroVideo.fallback}
        className={`${minHeight} flex items-center justify-center ${className}`}
        overlay={true}
        overlayOpacity={0.6}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-20">
          {children}
        </div>
      </HeroVideo>
    );
  }

  // Default hero section without video
  return (
    <section className={`hero-luxury-bg ${minHeight} flex items-center justify-center relative overflow-hidden ${className}`}>
      <div className="floating-3d-luxury"></div>
      <div className="floating-3d-luxury"></div>
      <div className="floating-3d-luxury"></div>
      <div className="floating-3d-luxury"></div>
      <div className="floating-3d-luxury"></div>
      <div className="luxury-particle"></div>
      <div className="luxury-particle"></div>
      <div className="luxury-particle"></div>
      <div className="luxury-particle"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
        {children}
      </div>
    </section>
  );
};

export default ThemedHeroSection;
