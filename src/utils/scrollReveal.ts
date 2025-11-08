// Scroll reveal utility for enhanced animations
export const initScrollReveal = () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, observerOptions);

  // Observe all elements with scroll-reveal class
  const elements = document.querySelectorAll('.scroll-reveal');
  elements.forEach((el) => observer.observe(el));

  // Observe all elements with stagger-animation class
  const staggerElements = document.querySelectorAll('.stagger-animation');
  staggerElements.forEach((el) => observer.observe(el));

  return () => {
    elements.forEach((el) => observer.unobserve(el));
    staggerElements.forEach((el) => observer.unobserve(el));
  };
};

// Initialize on DOM load
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initScrollReveal);
}