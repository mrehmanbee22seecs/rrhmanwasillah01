import { useEffect, useRef } from 'react';

export const useMagneticEffect = () => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = Math.max(rect.width, rect.height) / 2;
      
      if (distance < maxDistance) {
        const strength = (maxDistance - distance) / maxDistance;
        const moveX = (x / maxDistance) * strength * 20;
        const moveY = (y / maxDistance) * strength * 20;
        
        element.style.setProperty('--mouse-x', `${moveX}px`);
        element.style.setProperty('--mouse-y', `${moveY}px`);
        element.classList.add('animate-magnetic-pull');
      } else {
        element.style.setProperty('--mouse-x', '0px');
        element.style.setProperty('--mouse-y', '0px');
        element.classList.remove('animate-magnetic-pull');
      }
    };

    const handleMouseLeave = () => {
      element.style.setProperty('--mouse-x', '0px');
      element.style.setProperty('--mouse-y', '0px');
      element.classList.remove('animate-magnetic-pull');
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return ref;
};