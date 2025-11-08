import React, { useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Send } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { useAuth } from '../contexts/AuthContext';
import ContentEditor from './ContentEditor';
import EditButton from './EditButton';
import Logo from './Logo';

const EditableFooter = () => {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const { data: footerData, upsertContent: saveFooter } = useContent('footer_content', 'main');

  const defaultFooter = {
    arabicName: 'وسیلہ',
    englishName: 'Wasilah',
    tagline: 'Community Service',
    description: 'Empowering communities and building futures through collaborative service, meaningful connections, and sustainable positive change.',
    email: 'info@wasilah.org',
    phone: '+92 XXX XXXXXXX',
    address: 'Pakistan',
    facebookUrl: '#',
    twitterUrl: '#',
    instagramUrl: '#',
    linkedinUrl: '#'
  };

  const footer = footerData || defaultFooter;

  return (
    <>
      <footer className="bg-logo-navy text-cream-elegant relative overflow-hidden">
        {isAdmin && (
          <EditButton onClick={() => setEditingSection('footer')} />
        )}

        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-logo-navy-light/50 to-logo-navy-dark/30"></div>
          <div className="luxury-particle"></div>
          <div className="luxury-particle"></div>
          <div className="luxury-particle"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-4 mb-8">
                <div className="transform transition-transform duration-500 hover:scale-110 hover:rotate-3">
                  <Logo className="w-16 h-16" />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-luxury-display text-cream-soft">
                    <span className="text-lg font-arabic block">{footer.arabicName}</span>
                    <span className="text-2xl">{footer.englishName}</span>
                  </span>
                  <span className="text-sm font-luxury-body text-vibrant-orange-light -mt-1">{footer.tagline}</span>
                </div>
              </div>
              <p className="text-cream-soft/80 font-luxury-body mb-8 max-w-md leading-relaxed text-lg">
                {footer.description}
              </p>

              <div className="mb-8">
                <h4 className="text-xl font-luxury-heading text-vibrant-orange-light mb-4">Stay Connected</h4>
                <div className="flex max-w-md">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-6 py-4 bg-logo-navy-light/60 border-2 border-vibrant-orange/30 rounded-l-luxury text-cream-elegant placeholder-cream-elegant/60 focus:outline-none focus:border-vibrant-orange font-luxury-body backdrop-blur-luxury"
                  />
                  <button className="bg-gradient-to-r from-vibrant-orange to-vibrant-orange-light text-white px-8 py-4 rounded-r-luxury font-luxury-semibold hover:from-vibrant-orange-light hover:to-vibrant-orange transition-all duration-300 flex items-center">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <a href={footer.facebookUrl} className="w-12 h-12 bg-logo-navy-light/60 rounded-full flex items-center justify-center text-cream-elegant hover:text-vibrant-orange-light hover:bg-vibrant-orange/20 transition-all duration-400 hover:scale-110 backdrop-blur-luxury border border-vibrant-orange/20">
                  <Facebook className="w-6 h-6" />
                </a>
                <a href={footer.twitterUrl} className="w-12 h-12 bg-logo-navy-light/60 rounded-full flex items-center justify-center text-cream-elegant hover:text-vibrant-orange-light hover:bg-vibrant-orange/20 transition-all duration-400 hover:scale-110 backdrop-blur-luxury border border-vibrant-orange/20">
                  <Twitter className="w-6 h-6" />
                </a>
                <a href={footer.instagramUrl} className="w-12 h-12 bg-logo-navy-light/60 rounded-full flex items-center justify-center text-cream-elegant hover:text-vibrant-orange-light hover:bg-vibrant-orange/20 transition-all duration-400 hover:scale-110 backdrop-blur-luxury border border-vibrant-orange/20">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href={footer.linkedinUrl} className="w-12 h-12 bg-logo-navy-light/60 rounded-full flex items-center justify-center text-cream-elegant hover:text-vibrant-orange-light hover:bg-vibrant-orange/20 transition-all duration-400 hover:scale-110 backdrop-blur-luxury border border-vibrant-orange/20">
                  <Linkedin className="w-6 h-6" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-luxury-heading text-vibrant-orange-light mb-8">Quick Links</h3>
              <ul className="space-y-4">
                <li><a href="/about" className="text-cream-elegant/80 hover:text-vibrant-orange-light transition-colors duration-300 font-luxury-body text-lg hover:translate-x-2 inline-block transition-transform">About Us</a></li>
                <li><a href="/projects" className="text-cream-soft/80 hover:text-gold-light transition-colors duration-300 font-luxury-body text-lg hover:translate-x-2 inline-block transition-transform">Our Projects</a></li>
                <li><a href="/events" className="text-cream-soft/80 hover:text-gold-light transition-colors duration-300 font-luxury-body text-lg hover:translate-x-2 inline-block transition-transform">Events</a></li>
                <li><a href="/volunteer" className="text-cream-soft/80 hover:text-gold-light transition-colors duration-300 font-luxury-body text-lg hover:translate-x-2 inline-block transition-transform">Volunteer</a></li>
                <li><a href="/contact" className="text-cream-soft/80 hover:text-gold-light transition-colors duration-300 font-luxury-body text-lg hover:translate-x-2 inline-block transition-transform">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-luxury-heading text-gold-light mb-8">Get in Touch</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4 group">
                  <div className="w-10 h-10 bg-gold-accent/20 rounded-full flex items-center justify-center group-hover:bg-gold-accent/30 transition-colors">
                    <Mail className="w-5 h-5 text-gold-light" />
                  </div>
                  <span className="text-cream-soft/80 font-luxury-body text-lg group-hover:text-cream-soft transition-colors">{footer.email}</span>
                </div>
                <div className="flex items-center space-x-4 group">
                  <div className="w-10 h-10 bg-gold-accent/20 rounded-full flex items-center justify-center group-hover:bg-gold-accent/30 transition-colors">
                    <Phone className="w-5 h-5 text-gold-light" />
                  </div>
                  <span className="text-cream-soft/80 font-luxury-body text-lg group-hover:text-cream-soft transition-colors">{footer.phone}</span>
                </div>
                <div className="flex items-center space-x-4 group">
                  <div className="w-10 h-10 bg-gold-accent/20 rounded-full flex items-center justify-center group-hover:bg-gold-accent/30 transition-colors">
                    <MapPin className="w-5 h-5 text-gold-light" />
                  </div>
                  <span className="text-cream-soft/80 font-luxury-body text-lg group-hover:text-cream-soft transition-colors">{footer.address}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="section-divider"></div>

          <div className="text-center">
            <p className="text-cream-soft/60 font-luxury-body text-lg">
              © 2025 Wasilah. All rights reserved. Empowering communities, building futures.
            </p>
          </div>
        </div>
      </footer>

      <ContentEditor
        isOpen={editingSection === 'footer'}
        onClose={() => setEditingSection(null)}
        title="Edit Footer"
        fields={[
          { name: 'arabicName', label: 'Arabic Name', type: 'text', required: true },
          { name: 'englishName', label: 'English Name', type: 'text', required: true },
          { name: 'tagline', label: 'Tagline', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'email', label: 'Email Address', type: 'text', required: true },
          { name: 'phone', label: 'Phone Number', type: 'text', required: true },
          { name: 'address', label: 'Address', type: 'text', required: true },
          { name: 'facebookUrl', label: 'Facebook URL', type: 'text', required: false },
          { name: 'twitterUrl', label: 'Twitter URL', type: 'text', required: false },
          { name: 'instagramUrl', label: 'Instagram URL', type: 'text', required: false },
          { name: 'linkedinUrl', label: 'LinkedIn URL', type: 'text', required: false }
        ]}
        initialData={footer}
        onSave={(data) => saveFooter('main', data)}
      />
    </>
  );
};

export default EditableFooter;
