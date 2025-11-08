import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { ProjectApplicationEntry } from '../types/submissions';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface EditApplicationModalProps {
  application: ProjectApplicationEntry;
  onClose: () => void;
  onSuccess: () => void;
}

const EditApplicationModal: React.FC<EditApplicationModalProps> = ({ application, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: application.name || '',
    email: application.email || '',
    phone: application.phone || '',
    preferredRole: application.preferredRole || '',
    availability: application.availability || '',
    skills: Array.isArray(application.skills) ? application.skills.join(', ') : '',
    languageProficiency: Array.isArray(application.languageProficiency) ? application.languageProficiency.join(', ') : '',
    transportAvailable: application.transportAvailable || false,
    equipment: Array.isArray(application.equipment) ? application.equipment.join(', ') : '',
    accessibilityNeeds: application.accessibilityNeeds || '',
    emergencyContactName: application.emergencyContact?.name || '',
    emergencyContactPhone: application.emergencyContact?.phone || '',
    emergencyContactRelation: application.emergencyContactRelation || '',
    experience: application.experience || '',
    motivation: application.motivation || '',
    startAvailabilityDate: application.startAvailabilityDate || '',
    endAvailabilityDate: application.endAvailabilityDate || '',
    preferredContactMethod: application.preferredContactMethod || '',
    portfolioUrls: Array.isArray(application.portfolioUrls) ? application.portfolioUrls.join(', ') : '',
    heardAboutUs: application.heardAboutUs || '',
    whatsappConsent: application.whatsappConsent || false,
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
      const requestedChanges: Partial<ProjectApplicationEntry> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        preferredRole: formData.preferredRole,
        availability: formData.availability,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        languageProficiency: formData.languageProficiency.split(',').map(s => s.trim()).filter(Boolean),
        transportAvailable: formData.transportAvailable,
        equipment: formData.equipment.split(',').map(s => s.trim()).filter(Boolean),
        accessibilityNeeds: formData.accessibilityNeeds,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
        },
        emergencyContactRelation: formData.emergencyContactRelation,
        experience: formData.experience,
        motivation: formData.motivation,
        startAvailabilityDate: formData.startAvailabilityDate,
        endAvailabilityDate: formData.endAvailabilityDate,
        preferredContactMethod: formData.preferredContactMethod,
        portfolioUrls: formData.portfolioUrls.split(',').map(s => s.trim()).filter(Boolean),
        heardAboutUs: formData.heardAboutUs,
        whatsappConsent: formData.whatsappConsent,
      };

      // Save edit request to Firestore
      await addDoc(collection(db, 'project_application_edit_requests'), {
        originalApplicationId: application.id,
        projectId: application.projectId,
        projectTitle: application.projectTitle,
        userEmail: application.email,
        originalData: application,
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
          <h3 className="text-3xl font-luxury-heading text-black">Edit Application</h3>
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
              <label className="block font-luxury-medium text-black mb-2">Preferred Role</label>
              <input
                type="text"
                name="preferredRole"
                value={formData.preferredRole}
                onChange={handleInputChange}
                placeholder="e.g., Coordinator, Field Volunteer"
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block font-luxury-medium text-black mb-2">Availability (hours/week)</label>
            <input
              type="text"
              name="availability"
              value={formData.availability}
              onChange={handleInputChange}
              placeholder="e.g., 6-8 hrs/week, evenings, weekends"
              className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-luxury-medium text-black mb-2">Available From</label>
              <input
                type="date"
                name="startAvailabilityDate"
                value={formData.startAvailabilityDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
            <div>
              <label className="block font-luxury-medium text-black mb-2">Available Till</label>
              <input
                type="date"
                name="endAvailabilityDate"
                value={formData.endAvailabilityDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
          </div>

          {/* Skills & Languages */}
          <div>
            <label className="block font-luxury-medium text-black mb-2">Skills (comma-separated)</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleInputChange}
              placeholder="Project mgmt, First Aid, Photography"
              className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
            />
          </div>

          <div>
            <label className="block font-luxury-medium text-black mb-2">Languages (comma-separated)</label>
            <input
              type="text"
              name="languageProficiency"
              value={formData.languageProficiency}
              onChange={handleInputChange}
              placeholder="Urdu, English, Punjabi"
              className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
            />
          </div>

          {/* Transport & Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="transportAvailable"
                name="transportAvailable"
                checked={formData.transportAvailable}
                onChange={handleInputChange}
                className="mr-3"
              />
              <label htmlFor="transportAvailable" className="text-black">I have my own transport</label>
            </div>
          </div>

          <div>
            <label className="block font-luxury-medium text-black mb-2">Equipment (comma-separated)</label>
            <input
              type="text"
              name="equipment"
              value={formData.equipment}
              onChange={handleInputChange}
              placeholder="Laptop, Camera, Gloves"
              className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
            />
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-luxury-medium text-black mb-2">Emergency Contact Name</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
            <div>
              <label className="block font-luxury-medium text-black mb-2">Emergency Contact Phone</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
            <div>
              <label className="block font-luxury-medium text-black mb-2">Relation</label>
              <input
                type="text"
                name="emergencyContactRelation"
                value={formData.emergencyContactRelation}
                onChange={handleInputChange}
                placeholder="Parent, Sibling, Friend"
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
              />
            </div>
          </div>

          {/* Other Fields */}
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
            <label className="block font-luxury-medium text-black mb-2">Portfolio URLs (comma-separated)</label>
            <input
              type="text"
              name="portfolioUrls"
              value={formData.portfolioUrls}
              onChange={handleInputChange}
              placeholder="LinkedIn, GitHub, Website"
              className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
            />
          </div>

          <div>
            <label className="block font-luxury-medium text-black mb-2">Experience</label>
            <textarea
              name="experience"
              rows={3}
              value={formData.experience}
              onChange={handleInputChange}
              placeholder="Relevant experience or skills..."
              className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
            />
          </div>

          <div>
            <label className="block font-luxury-medium text-black mb-2">Motivation</label>
            <textarea
              name="motivation"
              rows={3}
              value={formData.motivation}
              onChange={handleInputChange}
              placeholder="Why do you want to join this project..."
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

export default EditApplicationModal;
