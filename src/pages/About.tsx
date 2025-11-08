import React from 'react';
import { Users, Target, Heart, Award, CheckCircle, Globe, Lightbulb, Shield, Handshake, Star, Quote } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useMagneticEffect } from '../hooks/useMagneticEffect';

const About = () => {
  const values = [
    {
      icon: Heart,
      title: 'Community First',
      description: 'Every decision we make prioritizes the needs and wellbeing of the communities we serve.'
    },
    {
      icon: Shield,
      title: 'Transparency',
      description: 'We maintain open communication and accountability in all our operations and initiatives.'
    },
    {
      icon: Users,
      title: 'Inclusive Participation',
      description: 'We welcome and value diverse perspectives, ensuring everyone has a voice in our mission.'
    },
    {
      icon: Globe,
      title: 'Sustainable Impact',
      description: 'We focus on creating long-term solutions that continue to benefit communities over time.'
    },
  ];

  const team = [
    {
      name: 'Dr. Amina Hassan',
      role: 'Executive Director',
      image: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=300',
      bio: 'Leading community development initiatives for over 15 years with a focus on sustainable change.'
    },
    {
      name: 'Ahmed Malik',
      role: 'Program Manager',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300',
      bio: 'Expert in project coordination and volunteer management with a passion for social impact.'
    },
    {
      name: 'Fatima Khan',
      role: 'Community Outreach Lead',
      image: 'https://images.pexels.com/photos/3763152/pexels-photo-3763152.jpeg?auto=compress&cs=tinysrgb&w=300',
      bio: 'Dedicated to building bridges between communities and creating meaningful connections.'
    },
    {
      name: 'Omar Sheikh',
      role: 'Operations Director',
      image: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=300',
      bio: 'Ensuring efficient operations and strategic planning for maximum community impact.'
    },
  ];

  return (
    <div className="py-12">
      {/* Header - Enhanced */}
      <section className="hero-luxury-bg hero-about text-cream-elegant py-24 relative overflow-hidden">
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>
        
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 bg-vibrant-orange/20 rounded-full animate-float-gentle"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-logo-teal/20 rounded-full animate-float-gentle" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-vibrant-orange-light/15 rounded-full animate-float-gentle" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-cinematic-fade">
            <h1 className="text-6xl md:text-7xl font-modern-display mb-8 animate-text-reveal">About Wasilah</h1>
            <p className="text-2xl font-elegant-body max-w-4xl mx-auto leading-relaxed animate-text-reveal" style={{animationDelay: '0.3s'}}>
              Discover our story, mission, and the passionate team working to empower communities 
              and build brighter futures together.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision - Enhanced */}
      <section className="py-24 bg-cream-white relative overflow-hidden">
        <div className="particle-container absolute inset-0 opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="text-center lg:text-left scroll-reveal">
              <div className="service-icon-luxury w-24 h-24 flex items-center justify-center mb-10 mx-auto lg:mx-0 magnetic-element group">
                <Target className="w-12 h-12 text-white group-hover:animate-pulse-glow" />
              </div>
              <h2 className="text-5xl font-modern-display text-black mb-8 group-hover:text-gradient-animated transition-all duration-500">Our Mission</h2>
              <p className="text-xl text-black font-elegant-body leading-relaxed mb-8">
                To serve as a bridge connecting individuals with meaningful opportunities to 
                make a positive impact in their communities through volunteer work, charitable 
                projects, and social initiatives.
              </p>
              <p className="text-xl text-black font-elegant-body leading-relaxed">
                We believe that every person has unique talents and resources that, when 
                channeled effectively, can create transformative change in the world around them.
              </p>
            </div>
            
            <div className="text-center lg:text-left scroll-reveal">
              <div className="service-icon-luxury w-24 h-24 flex items-center justify-center mb-10 mx-auto lg:mx-0 magnetic-element group">
                <Lightbulb className="w-12 h-12 text-white group-hover:animate-pulse-glow" />
              </div>
              <h2 className="text-5xl font-modern-display text-black mb-8 group-hover:text-gradient-animated transition-all duration-500">Our Vision</h2>
              <p className="text-xl text-black font-elegant-body leading-relaxed mb-8">
                To create a world where every individual has the opportunity to contribute 
                to the betterment of society, fostering a culture of empathy, collaboration, 
                and sustainable positive change.
              </p>
              <p className="text-xl text-black font-elegant-body leading-relaxed">
                We envision thriving communities where people support one another, where 
                resources are shared equitably, and where collective action leads to 
                lasting solutions for social challenges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values - Enhanced */}
      <section className="py-24 bg-cream-elegant relative overflow-hidden">
        <div className="absolute inset-0 morphing-background opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 scroll-reveal">
            <h2 className="text-5xl md:text-6xl font-modern-display text-black mb-8">
              Our Core Values
            </h2>
            <p className="text-2xl text-black font-elegant-body max-w-4xl mx-auto">
              The principles that guide every decision we make and every action we take
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 stagger-animation">
            {values.map((value, index) => (
              <div key={index} className="luxury-card bg-cream-white p-10 text-center floating-card magnetic-element group">
                <div className="service-icon-luxury w-20 h-20 flex items-center justify-center mx-auto mb-8 group-hover:animate-pulse-glow">
                  <value.icon className="w-10 h-10 text-white group-hover:animate-float-gentle" />
                </div>
                <h3 className="text-2xl font-luxury-heading text-black mb-6 group-hover:text-gradient-animated transition-all duration-500">{value.title}</h3>
                <p className="text-black font-elegant-body text-lg leading-relaxed group-hover:text-gray-800 transition-colors duration-300">{value.description}</p>
                <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-luxury"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-24 bg-cream-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-luxury-display text-logo-navy mb-8">
              What We Do
            </h2>
            <p className="text-2xl text-text-medium font-luxury-body max-w-4xl mx-auto">
              We facilitate meaningful connections between volunteers and community needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="luxury-card bg-cream-elegant p-10 luxury-hover-scale">
              <div className="service-icon-luxury w-20 h-20 flex items-center justify-center mb-8">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-luxury-heading text-text-dark mb-6">Volunteer Coordination</h3>
              <p className="text-text-medium font-luxury-body text-lg leading-relaxed">
                We match volunteers with suitable projects based on their skills, interests, 
                and availability to maximize impact and personal fulfillment.
              </p>
            </div>

            <div className="luxury-card bg-logo-navy p-10 luxury-hover-scale text-cream-elegant">
              <div className="service-icon-luxury w-20 h-20 flex items-center justify-center mb-8">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-luxury-heading mb-6">Project Management</h3>
              <p className="text-cream-soft/80 font-luxury-body text-lg leading-relaxed">
                We organize and oversee community projects from conception to completion, 
                ensuring effective resource utilization and measurable outcomes.
              </p>
            </div>

            <div className="luxury-card bg-cream-elegant p-10 luxury-hover-scale">
              <div className="service-icon-luxury w-20 h-20 flex items-center justify-center mb-8">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-luxury-heading text-text-dark mb-6">Community Building</h3>
              <p className="text-text-medium font-luxury-body text-lg leading-relaxed">
                We foster a sense of community through events, workshops, and ongoing 
                engagement opportunities that strengthen social bonds and collective action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-24 bg-cream-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-luxury-display text-logo-navy mb-8">
              Meet Our Team
            </h2>
            <p className="text-2xl text-text-medium font-luxury-body max-w-4xl mx-auto">
              The passionate individuals driving our mission forward every day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {team.map((member, index) => (
              <div key={index} className="luxury-card bg-cream-white rounded-luxury-lg overflow-hidden luxury-hover-scale">
                <div className="h-80 bg-gray-200 relative overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/20 to-transparent"></div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-luxury-heading text-navy-deep mb-3">{member.name}</h3>
                  <p className="text-vibrant-orange font-luxury-semibold mb-4 text-lg">{member.role}</p>
                  <p className="text-text-medium font-luxury-body leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section className="py-24 bg-logo-navy text-cream-elegant relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="floating-3d-luxury opacity-20"></div>
          <div className="floating-3d-luxury opacity-15"></div>
          <div className="luxury-particle"></div>
          <div className="luxury-particle"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-luxury-display mb-8">Our Impact</h2>
            <p className="text-2xl text-cream-soft/80 font-luxury-body max-w-4xl mx-auto">
              Measurable results from our commitment to community empowerment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-20">
            <div className="text-center luxury-hover-scale">
              <div className="text-6xl font-luxury-display text-vibrant-orange mb-4">5000+</div>
              <div className="text-cream-elegant/80 font-luxury-body text-xl">Active Volunteers</div>
            </div>
            <div className="text-center luxury-hover-scale">
              <div className="text-6xl font-luxury-display text-vibrant-orange mb-4">120+</div>
              <div className="text-cream-elegant/80 font-luxury-body text-xl">Projects Completed</div>
            </div>
            <div className="text-center luxury-hover-scale">
              <div className="text-6xl font-luxury-display text-vibrant-orange mb-4">50+</div>
              <div className="text-cream-elegant/80 font-luxury-body text-xl">Communities Served</div>
            </div>
            <div className="text-center luxury-hover-scale">
              <div className="text-6xl font-luxury-display text-vibrant-orange mb-4">25K+</div>
              <div className="text-cream-elegant/80 font-luxury-body text-xl">Lives Impacted</div>
            </div>
          </div>

          <div className="luxury-card bg-logo-navy-light/60 rounded-luxury-lg p-12 backdrop-blur-luxury border-2 border-vibrant-orange/20">
            <h3 className="text-3xl font-luxury-heading mb-10 text-center text-vibrant-orange-light">Recent Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-7 h-7 text-vibrant-orange flex-shrink-0 mt-1" />
                <p className="text-cream-elegant/80 font-luxury-body text-lg">Established education support programs in 15 schools</p>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-7 h-7 text-vibrant-orange flex-shrink-0 mt-1" />
                <p className="text-cream-elegant/80 font-luxury-body text-lg">Organized health awareness campaigns reaching 5,000+ people</p>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-7 h-7 text-vibrant-orange flex-shrink-0 mt-1" />
                <p className="text-cream-elegant/80 font-luxury-body text-lg">Coordinated disaster relief efforts for flood-affected areas</p>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-7 h-7 text-vibrant-orange flex-shrink-0 mt-1" />
                <p className="text-cream-elegant/80 font-luxury-body text-lg">Launched digital literacy workshops for 500+ seniors</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;