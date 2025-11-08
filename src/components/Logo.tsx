import React from 'react';

const Logo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <div className="relative group">
      <div className="absolute -inset-2 bg-gradient-to-r from-vibrant-orange to-vibrant-orange-light rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
      <img
        src="/logo.jpeg"
        alt="Wasilah Logo"
        className={`${className} object-contain rounded-xl relative filter drop-shadow-lg transition-all duration-300 group-hover:scale-110`}
      />
    </div>
  );
};

export default Logo;