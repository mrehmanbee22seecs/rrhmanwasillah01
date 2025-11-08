import React, { useEffect, useRef } from 'react';

interface HeroVideoProps {
  videoUrl: string;
  fallbackImage?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * HeroVideo component for Wasillah Special theme
 * Displays a looping video background with optional overlay
 * Uses copyright-free community service videos
 */
const HeroVideo: React.FC<HeroVideoProps> = ({
  videoUrl,
  fallbackImage,
  overlay = true,
  overlayOpacity = 0.5,
  className = '',
  children
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Ensure video plays on load
      video.play().catch(error => {
        console.warn('Video autoplay failed:', error);
      });
    }
  }, [videoUrl]);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        poster={fallbackImage}
      >
        <source src={videoUrl} type="video/mp4" />
        <source src={videoUrl.replace('.mp4', '.webm')} type="video/webm" />
        {/* Fallback for browsers that don't support video */}
        {fallbackImage && (
          <img
            src={fallbackImage}
            alt="Community service"
            className="w-full h-full object-cover"
          />
        )}
      </video>

      {/* Overlay for better text readability */}
      {overlay && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default HeroVideo;
