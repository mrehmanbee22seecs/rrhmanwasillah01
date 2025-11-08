import React from 'react';
import { useWasillahSpecial } from '../hooks/useWasillahSpecial';
import SectionWithBackground from './SectionWithBackground';
import { wasillahSpecialMedia } from '../config/wasillahSpecialMedia';

interface ThemedSectionProps {
  children: React.ReactNode;
  className?: string;
  backgroundType?: keyof typeof wasillahSpecialMedia.sectionBackgrounds;
  bgColor?: string;
}

/**
 * ThemedSection component
 * Automatically adds background images for Wasillah Special theme
 * Falls back to regular section for other themes
 */
const ThemedSection: React.FC<ThemedSectionProps> = ({
  children,
  className = '',
  backgroundType,
  bgColor = 'bg-cream-white'
}) => {
  const { hasSectionBackgrounds, getSectionBackground } = useWasillahSpecial();

  // If Wasillah Special theme and background type is specified
  if (hasSectionBackgrounds && backgroundType) {
    const background = getSectionBackground(backgroundType);

    if (background) {
      return (
        <SectionWithBackground
          backgroundImage={background.url}
          className={`${className}`}
          overlay={true}
          overlayOpacity={0.92}
          blendMode="soft-light"
        >
          {children}
        </SectionWithBackground>
      );
    }
  }

  // Default section without background image
  return (
    <section className={`${bgColor} ${className}`}>
      {children}
    </section>
  );
};

export default ThemedSection;
