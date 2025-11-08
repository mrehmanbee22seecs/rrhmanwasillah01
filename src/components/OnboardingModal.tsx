import React, { useState } from 'react';
import { X, User, Palette, CheckCircle, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('wasilah-classic');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentUser, userData, refreshUserData } = useAuth();
  const { themes, setTheme } = useTheme();

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

  const handleInterestToggle = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleComplete = async (skipWithoutSaving: boolean = false) => {
    if (!currentUser || !userData) {
      console.error('Cannot complete onboarding: missing user data');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      if (skipWithoutSaving) {
        // User clicked "Skip for Now" - mark onboarding as completed but don't save preferences
        await updateDoc(userRef, {
          'preferences.onboardingCompleted': true,
          'preferences.skipped': true,
          'preferences.completedAt': new Date(),
          'preferences.lastUpdated': new Date()
        });
      } else {
        // User completed onboarding - save all preferences
        await updateDoc(userRef, {
          displayName: displayName || userData.displayName,
          'preferences.theme': selectedTheme,
          'preferences.interests': interests,
          'preferences.onboardingCompleted': true,
          'preferences.skipped': false,
          'preferences.completedAt': new Date(),
          'preferences.lastUpdated': new Date()
        });

        // Apply theme only if user completed with preferences
        setTheme(selectedTheme);
      }

      // CRITICAL: Refresh user data to ensure state is synchronized
      await refreshUserData();
      
      // Small delay to ensure state propagation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError('Failed to save preferences. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-luxury-lg shadow-luxury">
        {/* Header */}
        <div className="bg-gradient-to-r from-vibrant-orange to-vibrant-orange-light text-white p-6 relative">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-3xl font-luxury-display mb-2">Welcome to Wasilah!</h2>
            <p className="text-cream-elegant/80">Let's personalize your experience</p>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Step {currentStep} of 3</span>
              <span>{Math.round((currentStep / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-luxury flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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

          {/* Step 1: Name */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-vibrant-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-vibrant-orange" />
              </div>
              <h3 className="text-2xl font-luxury-heading text-black mb-4">What should we call you?</h3>
              <p className="text-black/70 font-luxury-body mb-8">
                Help us personalize your experience by telling us your preferred name.
              </p>
              
              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={userData?.displayName || "Enter your name"}
                  className="w-full px-6 py-4 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body text-lg text-center"
                />
              </div>
              
              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="btn-luxury-primary px-8 py-3 flex items-center"
                >
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Theme Selection */}
          {currentStep === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-vibrant-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Palette className="w-10 h-10 text-vibrant-orange" />
                </div>
                <h3 className="text-2xl font-luxury-heading text-black mb-4">Choose Your Theme</h3>
                <p className="text-black/70 font-luxury-body">
                  Select a color theme that resonates with you. You can change this anytime later.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {themes.map((theme) => (
                  <div
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`relative p-6 rounded-luxury-lg border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                      selectedTheme === theme.id
                        ? 'border-vibrant-orange bg-vibrant-orange/5'
                        : 'border-gray-200 hover:border-vibrant-orange/50'
                    }`}
                  >
                    {selectedTheme === theme.id && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-vibrant-orange rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div 
                      className="w-full h-16 rounded-lg mb-4"
                      style={{ background: theme.preview }}
                    ></div>
                    
                    <h4 className="text-lg font-luxury-heading text-black mb-2">{theme.name}</h4>
                    <p className="text-black/70 font-luxury-body text-sm">{theme.description}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-luxury text-black font-luxury-semibold hover:bg-gray-50 flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="btn-luxury-primary px-8 py-3 flex items-center"
                >
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {currentStep === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-vibrant-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-vibrant-orange" />
                </div>
                <h3 className="text-2xl font-luxury-heading text-black mb-4">What interests you?</h3>
                <p className="text-black/70 font-luxury-body">
                  Select areas you're passionate about. We'll show you relevant projects and events.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    className={`p-4 rounded-luxury text-sm font-luxury-semibold transition-all duration-300 ${
                      interests.includes(interest)
                        ? 'bg-vibrant-orange text-white'
                        : 'bg-gray-100 text-black hover:bg-vibrant-orange/10'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-luxury text-black font-luxury-semibold hover:bg-gray-50 flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleComplete(true)}
                    disabled={loading}
                    className="px-6 py-3 border-2 border-gray-300 rounded-luxury text-black font-luxury-semibold hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loading ? 'Setting up...' : 'Skip for Now'}
                  </button>
                  <button
                    onClick={() => handleComplete(false)}
                    disabled={loading}
                    className="btn-luxury-primary px-8 py-3 flex items-center disabled:opacity-50"
                  >
                    {loading ? 'Setting up...' : 'Complete Setup'}
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;