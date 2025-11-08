import React from 'react';

interface SectionWithBackgroundProps {
  backgroundImage: string;
  overlay?: boolean;
  overlayOpacity?: number;
  blendMode?: 'normal' | 'multiply' | 'overlay' | 'soft-light' | 'hard-light';
  className?: string;
  children: React.ReactNode;
}

/**
 * SectionWithBackground component for Wasillah Special theme
 * Displays section content with a blended community service background image
 * Images blend masterfully with the content for emotional impact
 */
const SectionWithBackground: React.FC<SectionWithBackgroundProps> = ({
  backgroundImage,
  overlay = true,
  overlayOpacity = 0.85,
  blendMode = 'soft-light',
  className = '',
  children
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          mixBlendMode: blendMode,
          opacity: 0.15
        }}
      />

      {/* Subtle overlay for content readability */}
      {overlay && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-surface/95 via-surface/90 to-surface/95"
          style={{
            opacity: overlayOpacity,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default SectionWithBackground;
