import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Facebook, Twitter, Instagram, Send, Heart, Star } from 'lucide-react';
import { sendEmail, formatContactMessageEmail } from '../utils/emailService';
import { useAuth } from '../contexts/AuthContext';
import { useActivityLogger } from '../hooks/useActivityLogger';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useMagneticEffect } from '../hooks/useMagneticEffect';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const NewsletterSignup: React.FC<{ source?: 'contact' | 'footer' | 'other'; }> = ({ source = 'contact' }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    const value = email.trim();
    if (!value) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: value.toLowerCase(),
        source,
        subscribedAt: serverTimestamp(),
      });
      setEmail('');
      alert('Subscribed! You will receive our updates.');
    } catch (e) {
      console.error('Newsletter subscribe failed', e);
      alert('Subscription failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex w-full">
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="flex-1 h-12 px-4 border-2 border-gold-accent/30 rounded-l-luxury focus:outline-none focus:ring-2 focus:ring-gold-accent font-luxury-body"
        />
        <button
          onClick={subscribe}
          disabled={loading}
          aria-label="Subscribe to newsletter"
          className="btn-luxury-primary btn-sm h-12 rounded-l-none rounded-r-luxury px-5 whitespace-nowrap"
        >
          {loading ? 'Subscribing...' : 'Subscribe'}
        </button>
      </div>
    </div>
  );
};

const Contact = () => {
  const { logCustomActivity } = useActivityLogger();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log activity
    logCustomActivity('contact_form_submitted', formData);
    
    // Send email notification
    const emailData = formatContactMessageEmail({
      ...formData,
      timestamp: new Date().toISOString()
    });
    
    sendEmail(emailData).then((success) => {
      if (success) {
        alert('Thank you for your message! We will get back to you soon.');
      } else {
        alert('There was an error sending your message. Please try again or contact us directly.');
      }
    });
    
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Address',
      details: ['info@waseela.org', 'volunteers@waseela.org'],
      color: 'text-emerald-600'
    },
    {
      icon: Phone,
      title: 'Phone Numbers',
      details: ['+92 XXX XXXXXXX', '+92 XXX XXXXXXX'],
      color: 'text-teal-600'
    },
    {
      icon: MapPin,
      title: 'Office Locations',
      details: ['Karachi Office', 'Lahore Office', 'Islamabad Office'],
      color: 'text-blue-600'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      details: ['Mon-Fri: 9:00 AM - 6:00 PM', 'Sat: 10:00 AM - 4:00 PM', 'Sun: Closed'],
      color: 'text-purple-600'
    }
  ];

  const socialLinks = [
    {
      icon: Facebook,
      name: 'Facebook',
      url: '#',
      color: 'hover:text-blue-600'
    },
    {
      icon: Twitter,
      name: 'Twitter',
      url: '#',
      color: 'hover:text-sky-500'
    },
    {
      icon: Instagram,
      name: 'Instagram',
      url: '#',
      color: 'hover:text-pink-600'
    }
  ];

  const officeLocations = [
    {
      city: 'Karachi',
      address: '123 Community Center Road, Clifton, Karachi',
      phone: '+92 XXX XXXXXXX',
      email: 'karachi@waseela.org'
    },
    {
      city: 'Lahore',
      address: '456 Service Avenue, Gulberg, Lahore',
      phone: '+92 XXX XXXXXXX',
      email: 'lahore@waseela.org'
    },
    {
      city: 'Islamabad',
      address: '789 Volunteer Street, F-7, Islamabad',
      phone: '+92 XXX XXXXXXX',
      email: 'islamabad@waseela.org'
    }
  ];

  const subjectOptions = [
    'General Inquiry',
    'Volunteer Application',
    'Project Proposal',
    'Partnership Opportunity',
    'Event Information',
    'Donation Inquiry',
    'Media Request',
    'Other'
  ];

  return (
    <div className="py-12">
      {/* Header - Enhanced */}
      <section className="hero-luxury-bg hero-contact text-cream-soft py-24 relative overflow-hidden">
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
            <h1 className="text-6xl md:text-7xl font-modern-display mb-8 animate-text-reveal">Contact Us</h1>
            <p className="text-2xl font-elegant-body max-w-4xl mx-auto animate-text-reveal" style={{animationDelay: '0.3s'}}>
              Get in touch with us to learn more about our work or to get involved in our community initiatives
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contact Information Cards - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 stagger-animation">
          {contactInfo.map((info, index) => (
            <div key={index} className="luxury-card bg-cream-white p-8 text-center floating-card magnetic-element group">
              <div className="service-icon-luxury w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse-glow">
                <info.icon className="w-8 h-8 text-white group-hover:animate-float-gentle" />
              </div>
              <h3 className="text-xl font-luxury-heading text-text-dark mb-4 group-hover:text-gradient-animated transition-all duration-500">{info.title}</h3>
              <div className="space-y-1">
                {info.details.map((detail, idx) => (
                  <p key={idx} className="text-text-medium font-elegant-body group-hover:text-gray-800 transition-colors duration-300">{detail}</p>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-luxury"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form - Enhanced */}
            <div className="lg:col-span-2">
              <div className="luxury-card bg-cream-white p-10 scroll-reveal">
                <h3 className="text-3xl font-modern-display text-black mb-8">Send us a Message</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    />
                  </div>
                  <div>
                    <label className="block font-luxury-medium text-navy-deep mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 border-2 border-gold-accent/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-gold-accent focus:border-gold-accent font-luxury-body"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-luxury-medium text-navy-deep mb-2">
                    Subject *
                  </label>
                  <select
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gold-accent/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-gold-accent focus:border-gold-accent font-luxury-body"
                  >
                    <option value="">Select a subject</option>
                    {subjectOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-luxury-medium text-navy-deep mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    rows={6}
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Please provide details about your inquiry..."
                    className="w-full px-4 py-3 border-2 border-gold-accent/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-gold-accent focus:border-gold-accent font-luxury-body"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full liquid-button py-4 px-8 flex items-center justify-center text-lg group"
                >
                  <Send className="mr-3 w-6 h-6 group-hover:animate-float-gentle" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Social Media */}
            <div className="mt-10 luxury-card bg-cream-soft p-8">
              <h4 className="text-xl font-luxury-heading text-navy-deep mb-6 text-center">Follow Us</h4>
              <div className="flex justify-center space-x-6">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    className="w-12 h-12 bg-navy-deep/10 rounded-full flex items-center justify-center text-navy-deep hover:text-gold-accent hover:bg-gold-accent/20 transition-all duration-300 hover:scale-110"
                    aria-label={social.name}
                  >
                    <social.icon className="w-7 h-7" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Office Locations */}
          <div className="space-y-6">
            <h3 className="text-3xl font-luxury-heading text-navy-deep">Our Offices</h3>
            
            {officeLocations.map((office, index) => (
              <div key={index} className="luxury-card bg-cream-white p-8">
                <h4 className="text-xl font-luxury-heading text-navy-deep mb-4">{office.city} Office</h4>
                <div className="space-y-3 text-navy-deep/70">
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 mr-3 mt-1 text-gold-accent flex-shrink-0" />
                    <p className="font-luxury-body">{office.address}</p>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 mr-3 text-gold-accent" />
                    <p className="font-luxury-body">{office.phone}</p>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-3 text-gold-accent" />
                    <p className="font-luxury-body">{office.email}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Quick Contact */}
            <div className="luxury-card bg-gold-accent/10 p-8">
              <h4 className="text-xl font-luxury-heading text-navy-deep mb-4">Need Immediate Help?</h4>
              <p className="text-navy-deep/70 font-luxury-body mb-4">
                For urgent matters or immediate assistance, please call our main helpline:
              </p>
              <p className="text-navy-deep font-luxury-semibold text-lg">+92 XXX XXXXXXX</p>
              <p className="text-gold-dark font-luxury-body mt-2">Available 24/7 for emergencies</p>
            </div>

            {/* Newsletter Signup */}
            <div className="luxury-card bg-cream-soft p-8">
              <h4 className="text-xl font-luxury-heading text-navy-deep mb-4">Stay Updated</h4>
              <p className="text-navy-deep/70 font-luxury-body mb-6">
                Subscribe to our newsletter to receive updates about our latest projects and events.
              </p>
              <div className="flex">
                <NewsletterSignup source="contact" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;