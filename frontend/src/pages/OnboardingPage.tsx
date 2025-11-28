/**
 * ENHANCED ONBOARDING FLOW: Updated to include user details collection and success popup
 * New flow: UserDetails → Age/Interests → Preferences → Success Popup → Explore
 *
 * Changes made:
 * - Added UserDetailsStep (step 0) to collect name and email
 * - Added RegistrationSuccessPopup after completion
 * - Updated step numbering to accommodate new step
 * - Enhanced user experience with personalized success message
 * - Added database check to redirect existing users to home page
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import UserDetailsStep from '../components/UserDetailsStep'; // NEW: User details collection
import OnboardingStep1 from '../components/OnboardingStep1';
import OnboardingStep2 from '../components/OnboardingStep2';
import RegistrationSuccessPopup from '../components/RegistrationSuccessPopup'; // NEW: Success popup

const OnboardingPage: React.FC = () => {
  // STEP MANAGEMENT: Updated to start with step 0 (UserDetailsStep)
  const [currentStep, setCurrentStep] = useState(0); // 0: UserDetails, 1: Age/Interests, 2: Preferences
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); // NEW: Success popup state
  const [isCheckingUser, setIsCheckingUser] = useState(true); // Loading state for database check
  const { userData, setUserData, updateOnboardingData, completeOnboarding } = useUser();
  const navigate = useNavigate();

  /**
   * ONBOARDING CHECK: Verify if user should see onboarding
   * Only redirect if user is explicitly marked as NOT new user
   */
  useEffect(() => {
    const checkUserOnboardingStatus = async () => {
      try {
        // If user is explicitly marked as NOT a new user, redirect to explore
        if (userData.isLoggedIn && userData.isNewUser === false) {
          navigate('/', { replace: true });
          return;
        }

        // If user doesn't have email, they shouldn't be here
        if (!userData.email || userData.email.trim() === '') {
          navigate('/', { replace: true });
          return;
        }

        // New user with email - show onboarding
        setIsCheckingUser(false);
      } catch (error) {
        console.error('❌ Error checking onboarding status:', error);
        setIsCheckingUser(false);
      }
    };

    // Small delay to ensure UserContext has loaded
    const checkTimer = setTimeout(() => {
      checkUserOnboardingStatus();
    }, 100);

    return () => clearTimeout(checkTimer);
  }, [userData.email, userData.isNewUser, userData.isLoggedIn, navigate]);

  // Show loading while checking database
  if (isCheckingUser) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 tracking-wider">CASA</h1>
          <p className="text-gray-400">Checking your account...</p>
        </div>
      </div>
    );
  }

  /**
   * NEW STEP HANDLER: Handles user details collection (name, email, and gender)
   * Saves the collected information to user context and proceeds to next step
   */
  const handleUserDetailsContinue = (name: string, email: string, gender: string) => {
    setUserData({
      ...userData,
      name, // Store collected name
      email, // Store collected email
      gender // Store collected gender
    });
    setCurrentStep(1); // Proceed to age/interests step
  };

  const handleStep1Continue = (ageRange: string, styleInterests: string[]) => {
    updateOnboardingData({
      ageRange,
      styleInterests
    });
    setCurrentStep(2);
  };

  const handleStep2Continue = async (preferredFits: string[]) => {
    
    // First update the onboarding data
    updateOnboardingData({
      preferredFits
    });
    
    
    // Use a more reliable approach - wait for next render cycle
    await new Promise(resolve => setTimeout(resolve, 0));
    
    
    try {
      await completeOnboarding();
      // ENHANCED UX: Show success popup instead of immediately navigating to home
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  /**
   * SUCCESS POPUP HANDLER: Closes popup and navigates to explore page
   * This provides a better user experience than immediate navigation
   */
  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false);
    navigate('/'); // Navigate to explore after user acknowledges success
  };
  return (
    <div>
      {/* STEP 0: NEW - User Details Collection (Name & Email) */}
      {currentStep === 0 && (
        <UserDetailsStep onContinue={handleUserDetailsContinue} />
      )}
      {/* STEP 1: Age Range and Style Interests */}
      {currentStep === 1 && (
        <OnboardingStep1 onContinue={handleStep1Continue} />
      )}
      {/* STEP 2: Preferred Fits */}
      {currentStep === 2 && (
        <OnboardingStep2 onContinue={handleStep2Continue} />
      )}

      {/* NEW: Success Popup with personalized message */}
      <RegistrationSuccessPopup
        isOpen={showSuccessPopup}
        onClose={handleSuccessPopupClose}
        userName={userData.name} // Pass collected name for personalization
      />
    </div>
  );
};

export default OnboardingPage;
