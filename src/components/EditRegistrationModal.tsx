import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { EventRegistrationEntry } from '../types/submissions';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface EditRegistrationModalProps {
  registration: EventRegistrationEntry;
  onClose: () => void;
  onSuccess: () => void;
}

const EditRegistrationModal: React.FC<EditRegistrationModalProps> = ({ registration, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: registration.name || '',
    email: registration.email || '',
    phone: registration.phone || '',
    emergencyContact: registration.emergencyContact || '',
    dietaryRestrictions: registration.dietaryRestrictions || '',
    medicalConditions: registration.medicalConditions || '',
    experience: registration.experience || '',
    shiftPreference: registration.shiftPreference || '',
    sessionSelections: Array.isArray(registration.sessionSelections) ? registration.sessionSelections.join(', ') : '',
    teamPreference: registration.teamPreference || '',
    tShirtSize: registration.tShirtSize || '',
    accessibilityNeeds: registration.accessibilityNeeds || '',
    preferredContactMethod: registration.preferredContactMethod || '',
    heardAboutUs: registration.heardAboutUs || '',
    whatsappConsent: registration.whatsappConsent || false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prepare requested changes
      const requestedChanges: Partial<EventRegistrationEntry> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        emergencyContact: formData.emergencyContact,
        dietaryRestrictions: formData.dietaryRestrictions,
        medicalConditions: formData.medicalConditions,
        experience: formData.experience,
        shiftPreference: formData.shiftPreference,
        sessionSelections: formData.sessionSelections.split(',').map(s => s.trim()).filter(Boolean),
        teamPreference: formData.teamPreference,
        tShirtSize: formData.tShirtSize,
        accessibilityNeeds: formData.accessibilityNeeds,
        preferredContactMethod: formData.preferredContactMethod,
        heardAboutUs: formData.heardAboutUs,
        whatsappConsent: formData.whatsappConsent,
      };

      // Save edit request to Firestore
      await addDoc(collection(db, 'event_registration_edit_requests'), {
        originalRegistrationId: registration.id,
        eventId: registration.eventId,
        eventTitle: registration.eventTitle,
        userEmail: registration.email,
        originalData: registration,
        requestedChanges,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error submitting edit request:', error);
      alert('Failed to submit edit request. Please try again.');
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="luxury-card bg-cream-white max-w-md w-full p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-luxury-heading text-black mb-4">Edit Request Submitted!</h3>
          <p className="text-black mb-2">Your changes have been submitted for admin review.</p>
          <p className="text-black/70 text-sm">You will be notified once your changes are reviewed and approved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="luxury-card bg-cream-white max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-3xl font-luxury-heading text-black">Edit Registration</h3>
          <button
            onClick={onClose}
            className="text-black hover:text-vibrant-orange text-2xl"
          >
            <X />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-black text-sm">
            <strong>Note:</strong> Your changes will be reviewed by an administrator before being applied.
            You'll be notified once your changes are approved or if any additional information is needed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-luxury-medium text-black mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
            <div>
              <label className="block font-luxury-medium text-black mb-2">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-luxury-medium text-black mb-2">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
            <div>
              <label className="block font-luxury-medium text-black mb-2">Emergency Contact</label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                placeholder="Name and phone number"
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
          </div>

          {/* Health & Dietary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-luxury-medium text-black mb-2">Dietary Restrictions/Allergies</label>
              <input
                type="text"
                name="dietaryRestrictions"
                value={formData.dietaryRestrictions}
                onChange={handleInputChange}
                placeholder="Any dietary restrictions or allergies"
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
            <div>
              <label className="block font-luxury-medium text-black mb-2">Medical Conditions</label>
              <input
                type="text"
                name="medicalConditions"
                value={formData.medicalConditions}
                onChange={handleInputChange}
                placeholder="Any important medical information"
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
          </div>

          {/* Event Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-luxury-medium text-black mb-2">Shift Preference</label>
              <input
                type="text"
                name="shiftPreference"
                value={formData.shiftPreference}
                onChange={handleInputChange}
                placeholder="Morning, Afternoon, Evening"
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
            <div>
              <label className="block font-luxury-medium text-black mb-2">T-Shirt Size</label>
              <input
                type="text"
                name="tShirtSize"
                value={formData.tShirtSize}
                onChange={handleInputChange}
                placeholder="S, M, L, XL"
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
          </div>

          <div>
            <label className="block font-luxury-medium text-black mb-2">Session Selections (comma-separated)</label>
            <input
              type="text"
              name="sessionSelections"
              value={formData.sessionSelections}
              onChange={handleInputChange}
              placeholder="Track A, Workshop 2, Keynote"
              className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
            />
          </div>

          <div>
            <label className="block font-luxury-medium text-black mb-2">Team Preference</label>
            <input
              type="text"
              name="teamPreference"
              value={formData.teamPreference}
              onChange={handleInputChange}
              placeholder="Buddy/team name, if any"
              className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
            />
          </div>

          <div>
            <label className="block font-luxury-medium text-black mb-2">Accessibility Needs</label>
            <input
              type="text"
              name="accessibilityNeeds"
              value={formData.accessibilityNeeds}
              onChange={handleInputChange}
              placeholder="Any accommodations required"
              className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
            />
          </div>

          {/* Contact Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-luxury-medium text-black mb-2">Preferred Contact Method</label>
              <input
                type="text"
                name="preferredContactMethod"
                value={formData.preferredContactMethod}
                onChange={handleInputChange}
                placeholder="WhatsApp, Email, Phone"
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
            <div>
              <label className="block font-luxury-medium text-black mb-2">How did you hear about us?</label>
              <input
                type="text"
                name="heardAboutUs"
                value={formData.heardAboutUs}
                onChange={handleInputChange}
                placeholder="Friend, Social media, University"
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
          </div>

          <div>
            <label className="block font-luxury-medium text-black mb-2">Previous Experience</label>
            <textarea
              name="experience"
              rows={3}
              value={formData.experience}
              onChange={handleInputChange}
              placeholder="Any relevant experience or special skills..."
              className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="whatsappConsent"
              name="whatsappConsent"
              checked={formData.whatsappConsent}
              onChange={handleInputChange}
              className="mr-3"
            />
            <label htmlFor="whatsappConsent" className="text-black">Contact via WhatsApp</label>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-luxury text-black font-luxury-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-luxury-primary py-3 px-6 flex items-center justify-center disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Submit for Review
                  <Send className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRegistrationModal;
