import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Facebook, Twitter, Instagram, Send, CreditCard as Edit2, Save } from 'lucide-react';
import { useEditableContent } from '../hooks/useEditableContent';
import { useAuth } from '../contexts/AuthContext';

const ContactEditable = () => {
  const { isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const defaultContent = {
    title: 'Contact Us',
    subtitle: 'Get in touch with us to learn more about our work or to get involved in our community initiatives',
    contactInfo: [
      { type: 'email', title: 'Email Address', details: ['info@waseela.org', 'volunteers@waseela.org'] },
      { type: 'phone', title: 'Phone Numbers', details: ['+92 XXX XXXXXXX', '+92 XXX XXXXXXX'] },
      { type: 'location', title: 'Office Locations', details: ['Karachi Office', 'Lahore Office', 'Islamabad Office'] },
      { type: 'hours', title: 'Working Hours', details: ['Mon-Fri: 9:00 AM - 6:00 PM', 'Sat: 10:00 AM - 4:00 PM', 'Sun: Closed'] }
    ],
    officeLocations: [
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
    ]
  };

  const { content, updateField, saveContent, saving } = useEditableContent('contact', defaultContent);

  const handleSave = async () => {
    const success = await saveContent(content);
    if (success) {
      setIsEditing(false);
      alert('Content saved successfully!');
    } else {
      alert('Failed to save content. Please try again.');
    }
  };

  return (
    <div className="py-12">
      {isAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-luxury-primary px-6 py-3 inline-flex items-center"
            >
              <Edit2 className="w-5 h-5 mr-2" />
              Edit Page
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-luxury-primary px-6 py-3 inline-flex items-center disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 border-2 border-gray-300 rounded-luxury text-black font-luxury-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <section className="hero-luxury-bg text-cream-soft py-24 relative overflow-hidden">
        <div className="floating-3d-luxury"></div>
        <div className="floating-3d-luxury"></div>
        <div className="luxury-particle"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {isEditing ? (
            <>
              <input
                type="text"
                value={content.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="text-6xl md:text-7xl font-luxury-display mb-8 w-full text-center bg-transparent border-b-2 border-white/50 text-cream-soft focus:outline-none"
              />
              <textarea
                value={content.subtitle}
                onChange={(e) => updateField('subtitle', e.target.value)}
                rows={2}
                className="text-2xl font-luxury-body max-w-4xl mx-auto w-full bg-transparent border-2 border-white/50 rounded p-4 text-cream-soft focus:outline-none"
              />
            </>
          ) : (
            <>
              <h1 className="text-6xl md:text-7xl font-luxury-display mb-8 animate-cinematic-fade">{content.title}</h1>
              <p className="text-2xl font-luxury-body max-w-4xl mx-auto">{content.subtitle}</p>
            </>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center text-gray-600 mb-8">
          This is an editable version of the Contact page. Use the admin panel to manage content.
        </p>
      </div>
    </div>
  );
};

export default ContactEditable;
