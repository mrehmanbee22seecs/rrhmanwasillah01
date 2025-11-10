import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Target, Award, Heart, CheckCircle, Star, Quote, Globe, Lightbulb, Shield, Handshake } from 'lucide-react';

const Home = () => {
  const [counters, setCounters] = useState({
    volunteers: 0,
    projects: 0,
    communities: 0,
    lives: 0
  });

  const impactStats = [
    { number: '5000+', label: 'Active Volunteers', icon: Users, key: 'volunteers', target: 5000 },
    { number: '120+', label: 'Projects Completed', icon: Target, key: 'projects', target: 120 },
    { number: '50+', label: 'Communities Served', icon: Heart, key: 'communities', target: 50 },
    { number: '25K+', label: 'Lives Impacted', icon: Award, key: 'lives', target: 25000 },
  ];

  const programs = [
    {
      title: 'Education Support',
      description: 'Providing quality education resources and tutoring to underserved communities.',
      icon: '📚',
      color: 'bg-cream-elegant',
      textColor: 'text-dark-readable'
    },
    {
      title: 'Healthcare Access',
      description: 'Organizing health camps and awareness programs for better community health.',
      icon: '🏥',
      color: 'bg-logo-navy',
      textColor: 'text-cream-elegant'
    },
    {
      title: 'Skills Development',
      description: 'Vocational training and skill-building workshops for economic empowerment.',
      icon: '🛠️',
      color: 'bg-cream-elegant',
      textColor: 'text-dark-readable'
    },
    {
      title: 'Environmental Action',
      description: 'Community-driven environmental conservation and sustainability initiatives.',
      icon: '🌱',
      color: 'bg-logo-navy',
      textColor: 'text-cream-elegant'
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Ahmed',
      role: 'Community Volunteer',
      image: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=150',
      quote: 'Wasilah has given me the platform to make a real difference in my community. The impact we create together is truly inspiring.',
      rating: 5
    },
    {
      name: 'Muhammad Hassan',
      role: 'Project Coordinator',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
      quote: 'Working with Wasilah has been transformative. We are building stronger, more resilient communities every day.',
      rating: 5
    },
    {
      name: 'Fatima Khan',
      role: 'Education Volunteer',
      image: 'https://images.pexels.com/photos/3763152/pexels-photo-3763152.jpeg?auto=compress&cs=tinysrgb&w=150',
      quote: 'The education programs have changed countless lives. I am proud to be part of this incredible movement.',
      rating: 5
    },
  ];

  // Counter animation effect
  useEffect(() => {
    const animateCounters = () => {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const stepDuration = duration / steps;

      impactStats.forEach(stat => {
        let current = 0;
        const increment = stat.target / steps;
        
        const timer = setInterval(() => {
          current += increment;
          if (current >= stat.target) {
            current = stat.target;
            clearInterval(timer);
          }
          
          setCounters(prev => ({
            ...prev,
            [stat.key]: Math.floor(current)
          }));
        }, stepDuration);
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          observer.disconnect();
        }
      });
    });

    const statsSection = document.getElementById('impact-stats');
    if (statsSection) {
      observer.observe(statsSection);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {/* Hero Section - Enhanced Emotional Design */}
      <section className="hero-luxury-bg hero-home min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Enhanced 3D Floating Elements */}
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="floating-3d-luxury magnetic-element"></div>
        
        {/* Enhanced Luxury Particles */}
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>
        
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 bg-vibrant-orange/20 rounded-full animate-float-gentle"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-logo-teal/20 rounded-full animate-float-gentle" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-vibrant-orange-light/15 rounded-full animate-float-gentle" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center relative z-10">
          <div className="animate-cinematic-fade">
            {/* Enhanced Central Logo */}
            <div className="mb-16 logo-integrated">
              <div className="logo-container-hero relative">
                <div className="logo-glow-ring"></div>
                <img 
                  src="/logo.jpeg" 
                  alt="Wasilah Logo" 
                  className="relative z-10"
                />
              </div>
              <h2 className="text-5xl font-arabic text-cream-elegant mb-4 mt-8 animate-text-reveal">وسیلہ</h2>
              <h3 className="text-3xl font-luxury-heading text-vibrant-orange-light animate-text-reveal" style={{animationDelay: '0.3s'}}>Wasilah</h3>
              <div className="mt-4 text-cream-elegant/80 text-lg font-elegant-body animate-text-reveal" style={{animationDelay: '0.5s'}}>
                Connecting Hearts • Building Communities
              </div>
            </div>

            <h1 className="text-6xl md:text-8xl font-luxury-display text-cream-elegant mb-8 leading-tight animate-text-reveal" style={{animationDelay: '0.6s'}}>
              Empowering Communities,
              <br />
              <span className="text-gradient-animated animate-text-shimmer">Building Futures</span>
            </h1>
            <p className="text-2xl md:text-3xl text-cream-elegant/90 mb-16 max-w-4xl mx-auto font-elegant-body leading-relaxed animate-text-reveal" style={{animationDelay: '0.9s'}}>
              Where compassion meets action. Join our mission to transform lives, strengthen 
              communities, and create lasting positive change through collective service and 
              unwavering dedication.
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center animate-text-reveal" style={{animationDelay: '1.2s'}}>
              <Link
                to="/volunteer"
                className="liquid-button text-xl px-12 py-6 inline-flex items-center group"
              >
                <Users className="mr-3 w-6 h-6 group-hover:animate-pulse" />
                Join Our Mission
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/about"
                className="btn-luxury-outline text-xl px-12 py-6 inline-flex items-center group"
              >
                Learn More
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Highlights - Enhanced */}
      <section id="impact-stats" className="section-story-community py-24 relative overflow-hidden">
        <div className="overlay-pattern"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 scroll-reveal">
            <h2 className="text-5xl md:text-6xl font-modern-display text-cream-elegant mb-8">
              Our Impact in Numbers
            </h2>
            <p className="text-2xl text-cream-elegant/90 font-elegant-body max-w-4xl mx-auto">
              See the tangible difference we're making in communities across the region
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 stagger-animation">
            {impactStats.map((stat, index) => (
              <div key={index} className="text-center floating-card luxury-card p-10 group magnetic-element bg-white/10 backdrop-blur-lg border-2 border-cream-elegant/20 shadow-lg">
                <div className="service-icon-luxury w-20 h-20 flex items-center justify-center mx-auto mb-8 group-hover:animate-pulse-glow">
                  <stat.icon className="w-10 h-10 text-cream-elegant group-hover:animate-float-gentle" />
                </div>
                <h3 className="text-5xl font-luxury-display impact-counter mb-4 animate-counter text-cream-elegant group-hover:text-vibrant-orange transition-colors">
                  {stat.key === 'lives' ? `${Math.floor(counters[stat.key] / 1000)}K+` : `${counters[stat.key]}+`}
                </h3>
                <p className="text-cream-elegant/80 font-luxury-medium text-lg group-hover:text-cream-elegant transition-colors">{stat.label}</p>
                <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-luxury"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Are Section - Enhanced */}
      <section className="section-story-community py-24 relative overflow-hidden">
        <div className="overlay-pattern"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative scroll-reveal">
              <div className="luxury-card bg-logo-navy p-12 text-center relative overflow-hidden interactive-3d group">
                <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/20 to-transparent group-hover:from-vibrant-orange/30 transition-all duration-500"></div>
                <div className="service-icon-luxury w-32 h-32 flex items-center justify-center mx-auto mb-8 group-hover:animate-pulse-glow">
                  <Heart className="w-16 h-16 text-white group-hover:animate-breathing" />
                </div>
                <h3 className="text-3xl font-luxury-heading text-cream-elegant mb-6 relative z-10 group-hover:text-gradient-animated transition-all duration-500">
                  Community at Heart
                </h3>
                <p className="text-cream-elegant/80 font-elegant-body text-lg relative z-10 leading-relaxed group-hover:text-cream-elegant transition-colors duration-300">
                  Every action we take is driven by our commitment to building stronger, 
                  more connected communities.
                </p>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </div>
            
            <div className="scroll-reveal">
              <h2 className="text-5xl md:text-6xl font-modern-display text-black mb-8 animate-text-reveal">
                Who We Are
              </h2>
              <p className="text-xl text-black font-elegant-body mb-8 leading-relaxed animate-text-reveal" style={{animationDelay: '0.2s'}}>
                Wasilah is more than a platform—we're a movement of passionate individuals 
                dedicated to creating positive change. Through collaborative service and 
                meaningful action, we connect communities with the resources and support 
                they need to thrive.
              </p>
              <p className="text-xl text-black font-elegant-body mb-10 leading-relaxed animate-text-reveal" style={{animationDelay: '0.4s'}}>
                Our mission is simple: empower communities to build their own futures 
                through sustainable development, education, and collective action.
              </p>
              <Link
                to="/about"
                className="liquid-button text-xl px-12 py-6 inline-flex items-center group animate-text-reveal"
                style={{animationDelay: '0.6s'}}
              >
                Learn More About Us
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Programs & Services - Enhanced */}
      <section className="py-24 bg-cream-white relative overflow-hidden">
        <div className="blend-overlay-soft"></div>
        <div className="particle-container absolute inset-0 opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 scroll-reveal">
            <h2 className="text-5xl md:text-6xl font-modern-display text-black mb-8">
              Our Programs
            </h2>
            <p className="text-2xl text-black font-elegant-body max-w-4xl mx-auto">
              Comprehensive initiatives designed to address community needs and create lasting impact
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 stagger-animation">
            {programs.map((program, index) => (
              <div key={index} className={`${program.color} ${program.textColor} p-12 rounded-luxury-lg floating-card luxury-card group relative overflow-hidden magnetic-element`}>
                <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="text-7xl mb-8 relative z-10 group-hover:animate-float-gentle">{program.icon}</div>
                <h3 className="text-3xl font-luxury-heading mb-6 group-hover:text-gradient-animated transition-all duration-500 relative z-10">
                  {program.title}
                </h3>
                <p className={`font-elegant-body text-lg leading-relaxed relative z-10 group-hover:text-black transition-colors duration-300 ${program.color.includes('navy') ? 'text-cream-elegant/80' : 'text-black'}`}>
                  {program.description}
                </p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-vibrant-orange to-vibrant-orange-light transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Slider - Enhanced */}
      <section className="section-story-volunteers py-24 relative overflow-hidden">
        <div className="overlay-pattern"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full animate-float-gentle backdrop-blur-sm"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/10 rounded-full animate-float-gentle backdrop-blur-sm" style={{animationDelay: '3s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 scroll-reveal">
            <h2 className="text-5xl md:text-6xl font-modern-display mb-8 text-cream-elegant">
              What Our Community Says
            </h2>
            <p className="text-2xl font-elegant-body max-w-4xl mx-auto text-cream-elegant/90">
              Hear from the volunteers and community members who make our mission possible
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 stagger-animation">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card bg-white/95 backdrop-blur-lg p-10 floating-card magnetic-element group">
                <div className="flex items-center mb-8">
                  <div className="relative group-hover:animate-pulse-glow">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-vibrant-orange/30 group-hover:border-vibrant-orange transition-all duration-300"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-vibrant-orange rounded-full flex items-center justify-center group-hover:animate-breathing">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-6">
                    <h4 className="text-xl font-luxury-heading text-black group-hover:text-gradient-animated transition-all duration-500">
                      {testimonial.name}
                    </h4>
                    <p className="font-elegant-body text-gray-700 group-hover:text-black transition-colors duration-300">{testimonial.role}</p>
                  </div>
                </div>
                
                <div className="flex mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-vibrant-orange fill-current group-hover:animate-pulse" style={{animationDelay: `${i * 0.1}s`}} />
                  ))}
                </div>
                
                <Quote className="w-10 h-10 text-vibrant-orange mb-6 group-hover:animate-float-gentle" />
                <p className="font-elegant-body text-lg leading-relaxed luxury-quote text-black group-hover:text-gray-800 transition-colors duration-300">
                  {testimonial.quote}
                </p>
                <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-luxury"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-Action Section - Enhanced */}
      <section className="cta-parallax py-24 text-cream-elegant relative overflow-hidden">
        {/* Enhanced 3D Floating Elements */}
        <div className="absolute inset-0">
          <div className="floating-3d-luxury opacity-30 magnetic-element"></div>
          <div className="floating-3d-luxury opacity-20 magnetic-element"></div>
          <div className="floating-3d-luxury opacity-25 magnetic-element"></div>
          <div className="floating-3d-luxury opacity-15 magnetic-element"></div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-vibrant-orange/10 rounded-full animate-float-gentle"></div>
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-logo-teal/10 rounded-full animate-float-gentle" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-vibrant-orange-light/15 rounded-full animate-float-gentle" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="scroll-reveal">
            <h2 className="text-5xl md:text-7xl font-modern-display mb-8 leading-tight animate-text-reveal">
              Together, We Can Build
              <br />
              <span className="text-gradient-animated animate-text-shimmer">Stronger Communities</span>
            </h2>
            <p className="text-2xl font-elegant-body mb-12 max-w-4xl mx-auto leading-relaxed text-cream-elegant/90 animate-text-reveal" style={{animationDelay: '0.3s'}}>
              Be part of something bigger. Join our movement and help create the positive change 
              our communities need and deserve.
            </p>
            <Link
              to="/volunteer"
              className="liquid-button text-xl px-16 py-6 inline-flex items-center group animate-text-reveal shadow-luxury-glow-lg hover:shadow-luxury-glow-lg"
              style={{animationDelay: '0.6s'}}
            >
              Become a Volunteer
              <ArrowRight className="ml-4 w-7 h-7 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;