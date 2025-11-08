import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, MapPin, Clock, Heart, Target, GraduationCap, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, OnboardingData } from '../types/user';
import RoleSelector from './RoleSelector';
import { ROLE_INFO } from '../utils/roleInfo';

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onComplete, onSkip }) => {
  const { completeOnboarding, currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [role, setRole] = useState<UserRole | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [causes, setCauses] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [location, setLocation] = useState<{ city?: string; province?: string; country?: string }>({
    city: '',
    province: '',
    country: 'Pakistan'
  });
  const [availability, setAvailability] = useState<{
    daysOfWeek?: string[];
    timeSlots?: string[];
    hoursPerWeek?: number;
  }>({
    daysOfWeek: [],
    timeSlots: [],
    hoursPerWeek: 0
  });
  const [bio, setBio] = useState('');
  
  // Role-specific data
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('');
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [year, setYear] = useState('');

  // Available options
  const interestOptions = [
    'Education Support',
    'Healthcare Access',
    'Environmental Projects',
    'Community Development',
    'Youth Programs',
    'Senior Care',
    'Disaster Relief',
    'Food Distribution',
    'Skills Training',
    'Women Empowerment',
    'Technology Training',
    'Event Organization'
  ];

  const causeOptions = [
    'Education',
    'Healthcare',
    'Environment',
    'Poverty Alleviation',
    'Women\'s Rights',
    'Children\'s Rights',
    'Disaster Relief',
    'Community Development',
    'Technology',
    'Arts & Culture',
    'Animal Welfare',
    'Mental Health'
  ];

  const skillOptions = [
    'Teaching',
    'Healthcare',
    'Technology',
    'Marketing',
    'Design',
    'Writing',
    'Photography',
    'Video Editing',
    'Event Planning',
    'Fundraising',
    'Translation',
    'Counseling',
    'Legal',
    'Accounting',
    'Project Management',
    'Public Speaking',
    'Social Media',
    'Graphic Design',
    'Web Development',
    'Data Analysis'
  ];

  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlotOptions = ['Morning (9 AM - 12 PM)', 'Afternoon (12 PM - 5 PM)', 'Evening (5 PM - 9 PM)'];

  const organizationTypes = [
    'NGO',
    'Non-Profit',
    'Charity',
    'Foundation',
    'Social Enterprise',
    'Community Organization',
    'University Club',
    'Student Society',
    'Other'
  ];

  const provinceOptions = [
    'Punjab',
    'Sindh',
    'Khyber Pakhtunkhwa',
    'Balochistan',
    'Islamabad Capital Territory',
    'Gilgit-Baltistan',
    'Azad Jammu and Kashmir'
  ];

  // Calculate total steps based on role
  const getTotalSteps = () => {
    if (!role) return 6; // Default to 6 steps if no role selected
    if (role === 'ngo' || role === 'student') return 7; // 7 steps for NGO and Student (includes role-specific step)
    return 6; // 6 steps for Volunteer
  };
  
  const totalSteps = getTotalSteps();

  const handleToggle = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const handleNext = () => {
    // Validation
    if (currentStep === 1 && !role) {
      setError('Please select a role');
      return;
    }
    if (currentStep === 2 && (interests.length === 0 && causes.length === 0)) {
      setError('Please select at least one interest or cause');
      return;
    }
    if (currentStep === 3 && skills.length === 0) {
      setError('Please select at least one skill');
      return;
    }
    if (currentStep === 4 && !location.city) {
      setError('Please enter your city');
      return;
    }
    if (currentStep === 5 && availability.daysOfWeek?.length === 0) {
      setError('Please select at least one day of availability');
      return;
    }
    if (currentStep === 6 && role === 'ngo' && !organizationName) {
      setError('Please enter your organization name');
      return;
    }
    if (currentStep === 6 && role === 'student' && !institution) {
      setError('Please enter your institution name');
      return;
    }

    setError(null);
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!currentUser || !role) return;

    setLoading(true);
    setError(null);

    try {
      const onboardingData: OnboardingData = {
        role,
        interests,
        causes,
        skills,
        location,
        availability: {
          daysOfWeek: availability.daysOfWeek,
          timeSlots: availability.timeSlots,
          hoursPerWeek: availability.hoursPerWeek || 0
        },
        bio: bio || undefined
      };

      if (role === 'ngo') {
        onboardingData.organizationName = organizationName;
        onboardingData.organizationType = organizationType;
      } else if (role === 'student') {
        onboardingData.institution = institution;
        onboardingData.degree = degree;
        onboardingData.year = year;
      }

      await completeOnboarding(onboardingData);
      onComplete();
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setError(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-vibrant-orange to-vibrant-orange-light text-white p-6 relative sticky top-0 z-10">
          <button
            onClick={handleSkip}
            disabled={loading}
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-3xl font-luxury-display mb-2">Welcome to Wasillah!</h2>
            <p className="text-cream-elegant/80">Let's personalize your experience</p>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5">⚠️</div>
              <div className="flex-1">
                <p className="text-red-800 font-luxury-body">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Role Selection */}
          {currentStep === 1 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-vibrant-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-vibrant-orange" />
                </div>
                <h3 className="text-2xl font-luxury-heading text-black mb-4">Who are you?</h3>
                <p className="text-black/70 font-luxury-body">
                  Select the option that best describes you. This helps us personalize your experience.
                </p>
              </div>
              <RoleSelector selectedRole={role} onRoleSelect={setRole} disabled={loading} />
            </div>
          )}

          {/* Step 2: Interests & Causes */}
          {currentStep === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-vibrant-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-vibrant-orange" />
                </div>
                <h3 className="text-2xl font-luxury-heading text-black mb-4">What interests you?</h3>
                <p className="text-black/70 font-luxury-body">
                  Select your interests and causes you're passionate about. We'll show you relevant opportunities.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block font-luxury-semibold text-black mb-3">Interests</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {interestOptions.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleToggle(interests, interest, setInterests)}
                        className={`p-3 rounded-xl text-sm font-luxury-semibold transition-all duration-300 ${
                          interests.includes(interest)
                            ? 'bg-vibrant-orange text-white shadow-lg'
                            : 'bg-gray-100 text-black hover:bg-vibrant-orange/10'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-luxury-semibold text-black mb-3">Causes (CSR Focus)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {causeOptions.map((cause) => (
                      <button
                        key={cause}
                        type="button"
                        onClick={() => handleToggle(causes, cause, setCauses)}
                        className={`p-3 rounded-xl text-sm font-luxury-semibold transition-all duration-300 ${
                          causes.includes(cause)
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-gray-100 text-black hover:bg-green-100'
                        }`}
                      >
                        {cause}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Skills */}
          {currentStep === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-vibrant-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10 text-vibrant-orange" />
                </div>
                <h3 className="text-2xl font-luxury-heading text-black mb-4">What are your skills?</h3>
                <p className="text-black/70 font-luxury-body">
                  Select your skills to help us match you with the right opportunities.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {skillOptions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleToggle(skills, skill, setSkills)}
                    className={`p-3 rounded-xl text-sm font-luxury-semibold transition-all duration-300 ${
                      skills.includes(skill)
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-black hover:bg-blue-100'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Location */}
          {currentStep === 4 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-vibrant-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-10 h-10 text-vibrant-orange" />
                </div>
                <h3 className="text-2xl font-luxury-heading text-black mb-4">Where are you located?</h3>
                <p className="text-black/70 font-luxury-body">
                  Help us find opportunities near you.
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="block font-luxury-semibold text-black mb-2">City *</label>
                  <input
                    type="text"
                    value={location.city || ''}
                    onChange={(e) => setLocation({ ...location, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="e.g., Karachi, Lahore, Islamabad"
                  />
                </div>

                <div>
                  <label className="block font-luxury-semibold text-black mb-2">Province</label>
                  <select
                    value={location.province || ''}
                    onChange={(e) => setLocation({ ...location, province: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  >
                    <option value="">Select Province</option>
                    {provinceOptions.map((province) => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-luxury-semibold text-black mb-2">Country</label>
                  <input
                    type="text"
                    value={location.country || 'Pakistan'}
                    onChange={(e) => setLocation({ ...location, country: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="Pakistan"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Availability */}
          {currentStep === 5 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-vibrant-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-vibrant-orange" />
                </div>
                <h3 className="text-2xl font-luxury-heading text-black mb-4">When are you available?</h3>
                <p className="text-black/70 font-luxury-body">
                  Let us know your availability to help match you with the right opportunities.
                </p>
              </div>

              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <label className="block font-luxury-semibold text-black mb-3">Days of the Week *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {dayOptions.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggle(availability.daysOfWeek || [], day, (days) => setAvailability({ ...availability, daysOfWeek: days }))}
                        className={`p-3 rounded-xl text-sm font-luxury-semibold transition-all duration-300 ${
                          availability.daysOfWeek?.includes(day)
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-gray-100 text-black hover:bg-purple-100'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-luxury-semibold text-black mb-3">Time Slots</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {timeSlotOptions.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleToggle(availability.timeSlots || [], slot, (slots) => setAvailability({ ...availability, timeSlots: slots }))}
                        className={`p-3 rounded-xl text-sm font-luxury-semibold transition-all duration-300 ${
                          availability.timeSlots?.includes(slot)
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-gray-100 text-black hover:bg-indigo-100'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-luxury-semibold text-black mb-2">Hours per Week (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={availability.hoursPerWeek || ''}
                    onChange={(e) => setAvailability({ ...availability, hoursPerWeek: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="e.g., 10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Role-Specific Information */}
          {currentStep === 6 && role === 'ngo' && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-vibrant-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-vibrant-orange" />
                </div>
                <h3 className="text-2xl font-luxury-heading text-black mb-4">Organization Information</h3>
                <p className="text-black/70 font-luxury-body">
                  Tell us about your organization.
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="block font-luxury-semibold text-black mb-2">Organization Name *</label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="e.g., Wasillah Foundation"
                    required
                  />
                </div>

                <div>
                  <label className="block font-luxury-semibold text-black mb-2">Organization Type</label>
                  <select
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  >
                    <option value="">Select Type</option>
                    {organizationTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && role === 'student' && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-vibrant-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="w-10 h-10 text-vibrant-orange" />
                </div>
                <h3 className="text-2xl font-luxury-heading text-black mb-4">Student Information</h3>
                <p className="text-black/70 font-luxury-body">
                  Tell us about your academic background.
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="block font-luxury-semibold text-black mb-2">Institution *</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="e.g., University of Karachi"
                    required
                  />
                </div>

                <div>
                  <label className="block font-luxury-semibold text-black mb-2">Degree/Program</label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="e.g., BS Computer Science"
                  />
                </div>

                <div>
                  <label className="block font-luxury-semibold text-black mb-2">Year</label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="e.g., 3rd Year, Final Year"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6/7: Bio (Optional) */}
          {((currentStep === 6 && role === 'volunteer') || (currentStep === 7 && (role === 'ngo' || role === 'student'))) && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-vibrant-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-vibrant-orange" />
                </div>
                <h3 className="text-2xl font-luxury-heading text-black mb-4">Tell us about yourself</h3>
                <p className="text-black/70 font-luxury-body">
                  Share a brief bio about yourself (optional).
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  placeholder="Write a brief introduction about yourself, your interests, and what you hope to achieve..."
                />
                <p className="text-xs text-black/60 mt-2">This will be visible on your profile</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl text-black font-luxury-semibold hover:bg-gray-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                disabled={loading}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-black font-luxury-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Skip for Now
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="btn-luxury-primary px-8 py-3 flex items-center disabled:opacity-50"
              >
                {currentStep === totalSteps ? (
                  <>
                    {loading ? 'Completing...' : 'Complete Setup'}
                    {!loading && <CheckCircle className="w-5 h-5 ml-2" />}
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;

