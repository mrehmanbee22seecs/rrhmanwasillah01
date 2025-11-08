import React, { useState } from 'react';
import { Heart, Users, Star, CheckCircle, ArrowRight, Award, Globe, Lightbulb } from 'lucide-react';
import { sendEmail, formatVolunteerApplicationEmail } from '../utils/emailService';
import { sendVolunteerConfirmation } from '../services/mailerSendEmailService';
import { useAuth } from '../contexts/AuthContext';
import { useActivityLogger } from '../hooks/useActivityLogger';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useMagneticEffect } from '../hooks/useMagneticEffect';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const Volunteer = () => {
  const { logCustomActivity } = useActivityLogger();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    city: '',
    occupation: '',
    experience: '',
    skills: [],
    interests: [],
    availability: '',
    motivation: ''
  });

  const skillOptions = [
    'Teaching/Education', 'Healthcare/Medical', 'Technology/IT', 'Marketing/Communications',
    'Event Planning', 'Project Management', 'Fundraising', 'Administration',
    'Translation', 'Photography', 'Graphic Design', 'Social Media',
    'Counseling', 'Legal Assistance', 'Engineering', 'Other'
  ];

  const interestAreas = [
    'Education Support', 'Health & Wellness', 'Environmental Projects', 'Community Development',
    'Youth Programs', 'Senior Care', 'Disaster Relief', 'Food Distribution',
    'Skills Training', 'Women Empowerment', 'Technology Training', 'Event Organization'
  ];

  const availabilityOptions = [
    'Weekends only', 'Weekday evenings', 'Flexible schedule', 'Full-time availability',
    'Once a month', 'Few hours per week', 'Seasonal/Project-based'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (field: 'skills' | 'interests', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log activity
    logCustomActivity('volunteer_application_submitted', formData);
    
    // Persist structured volunteer application
    try {
      await addDoc(collection(db, 'volunteer_applications'), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        age: formData.age || null,
        city: formData.city,
        occupation: formData.occupation || null,
        experience: formData.experience || '',
        skills: formData.skills || [],
        interests: formData.interests || [],
        availability: formData.availability,
        motivation: formData.motivation || '',
        submittedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to save volunteer application:', error);
    }

    // Send email notification (and store generic response)
    const emailData = formatVolunteerApplicationEmail({
      ...formData,
      timestamp: new Date().toISOString()
    });
    
    sendEmail(emailData).then((success) => {
      if (success) {
        // Also send confirmation via Resend
        sendVolunteerConfirmation({
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`
        }).catch(err => console.error('Resend confirmation failed:', err));
        
        alert('Thank you for your interest in volunteering! We will get back to you soon.');
      } else {
        alert('There was an error submitting your application. Please try again or contact us directly.');
      }
    });
    
  };

  const benefits = [
    {
      icon: Heart,
      title: 'Make a Difference',
      description: 'Contribute to meaningful projects that create lasting positive impact in your community.'
    },
    {
      icon: Users,
      title: 'Build Connections',
      description: 'Meet like-minded individuals and build valuable relationships while serving together.'
    },
    {
      icon: Star,
      title: 'Develop Skills',
      description: 'Gain new experiences, develop professional skills, and enhance your personal growth.'
    },
    {
      icon: CheckCircle,
      title: 'Flexible Commitment',
      description: 'Choose opportunities that fit your schedule and interests, with no long-term obligations.'
    }
  ];

  return (
    <div className="py-12">
      {/* Header - Enhanced */}
      <section className="hero-luxury-bg hero-volunteer text-cream-soft py-24 relative overflow-hidden">
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
            <h1 className="text-6xl md:text-7xl font-modern-display mb-8 animate-text-reveal">Join Our Mission</h1>
            <p className="text-2xl font-elegant-body max-w-4xl mx-auto animate-text-reveal" style={{animationDelay: '0.3s'}}>
              Become a volunteer and be part of the positive change you want to see in the world
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Why Volunteer Section - Enhanced */}
        <div className="mb-16 relative overflow-hidden">
          <div className="particle-container absolute inset-0 opacity-30"></div>
          <div className="relative z-10">
            <div className="text-center mb-12 scroll-reveal">
              <h2 className="text-4xl md:text-5xl font-modern-display text-black mb-8">Why Volunteer with Us?</h2>
              <p className="text-2xl text-black max-w-4xl mx-auto font-elegant-body">
                Volunteering with وسیلہ (Waseela) offers you the opportunity to make a meaningful 
                impact while growing personally and professionally.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 stagger-animation">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center floating-card magnetic-element group">
                  <div className="service-icon-luxury w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse-glow">
                    <benefit.icon className="w-10 h-10 text-white group-hover:animate-float-gentle" />
                  </div>
                  <h3 className="text-2xl font-luxury-heading text-black mb-4 group-hover:text-gradient-animated transition-all duration-500">{benefit.title}</h3>
                  <p className="text-black font-elegant-body text-lg group-hover:text-gray-800 transition-colors duration-300">{benefit.description}</p>
                  <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-luxury"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Volunteer Registration Form */}
          <div>
            <div className="luxury-card bg-cream-white p-10">
              <h3 className="text-3xl font-luxury-heading text-text-dark mb-8">Volunteer Registration</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-xl font-luxury-heading text-text-dark mb-6">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-luxury-medium text-text-dark mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      />
                    </div>
                    <div>
                      <label className="block font-luxury-medium text-text-dark mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      min="16"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills & Expertise
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {skillOptions.map((skill) => (
                      <label key={skill} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={() => handleCheckboxChange('skills', skill)}
                          className="mr-2 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Areas of Interest */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Areas of Interest
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {interestAreas.map((interest) => (
                      <label key={interest} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.interests.includes(interest)}
                          onChange={() => handleCheckboxChange('interests', interest)}
                          className="mr-2 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Availability *
                  </label>
                  <select
                    name="availability"
                    required
                    value={formData.availability}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select your availability</option>
                    {availabilityOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previous Volunteer Experience
                  </label>
                  <textarea
                    name="experience"
                    rows={3}
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="Briefly describe any previous volunteer experience (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Motivation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Why do you want to volunteer with us?
                  </label>
                  <textarea
                    name="motivation"
                    rows={3}
                    value={formData.motivation}
                    onChange={handleInputChange}
                    placeholder="Tell us what motivates you to volunteer and what you hope to achieve"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full btn-luxury-primary py-4 px-8 flex items-center justify-center text-lg"
                >
                  Submit Application
                  <ArrowRight className="ml-3 w-6 h-6" />
                </button>
              </form>
            </div>
          </div>

          {/* Information Sidebar */}
          <div className="space-y-8">
            {/* Process */}
            <div className="luxury-card bg-gold-accent/10 p-8">
              <h3 className="text-2xl font-luxury-heading text-navy-deep mb-6">Application Process</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="bg-gold-accent text-navy-deep w-8 h-8 rounded-full flex items-center justify-center font-luxury-semibold mr-4">1</div>
                  <span className="text-navy-deep font-luxury-body text-lg">Submit your application</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-gold-accent text-navy-deep w-8 h-8 rounded-full flex items-center justify-center font-luxury-semibold mr-4">2</div>
                  <span className="text-navy-deep font-luxury-body text-lg">We'll review and contact you</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-gold-accent text-navy-deep w-8 h-8 rounded-full flex items-center justify-center font-luxury-semibold mr-4">3</div>
                  <span className="text-navy-deep font-luxury-body text-lg">Attend orientation session</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-gold-accent text-navy-deep w-8 h-8 rounded-full flex items-center justify-center font-luxury-semibold mr-4">4</div>
                  <span className="text-navy-deep font-luxury-body text-lg">Start volunteering!</span>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="luxury-card bg-navy-deep/5 p-8">
              <h3 className="text-2xl font-luxury-heading text-navy-deep mb-6">Requirements</h3>
              <ul className="space-y-3 text-navy-deep/80 font-luxury-body text-lg">
                <li>• Must be at least 16 years old</li>
                <li>• Passionate about community service</li>
                <li>• Reliable and committed</li>
                <li>• Good communication skills</li>
                <li>• Background check may be required</li>
                <li>• Willing to attend training sessions</li>
              </ul>
            </div>

            {/* Contact */}
            <div className="luxury-card bg-cream-soft p-8">
              <h3 className="text-2xl font-luxury-heading text-navy-deep mb-6">Questions?</h3>
              <p className="text-navy-deep/70 mb-4 font-luxury-body text-lg">
                Have questions about volunteering? We're here to help!
              </p>
              <div className="space-y-3 text-navy-deep/80 font-luxury-body text-lg">
                <p>📧 volunteers@waseela.org</p>
                <p>📞 +92 XXX XXXXXXX</p>
                <p>🕒 Mon-Fri, 9:00 AM - 5:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Volunteer;