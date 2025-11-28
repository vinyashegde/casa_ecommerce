import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import OtpInput from './OtpInput';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: (email: string) => void;
}

const LoginPopup: React.FC<LoginPopupProps> = ({ isOpen, onClose, onContinue }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'location'>('email');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [fullEmail, setFullEmail] = useState('');
  const [location, setLocation] = useState('');

  const { setUserData } = useUser();
  const navigate = useNavigate();

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email);
  };

  const isEmailValid = validateEmail(email);

  const handleContinue = async () => {
    if (!isEmailValid) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');
    setFullEmail(email);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/users/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          setGeneratedOtp(data.otp?.toString() || '');
          setStep('otp');
        } else if (data.otp) {
          setGeneratedOtp(data.otp.toString());
          setStep('otp');
          setEmailError('Email service unavailable, but OTP generated. Check console for OTP.');
        } else {
          setEmailError(data.error || 'Failed to generate OTP');
        }
      } else {
        const errorData = await response.json();
        setEmailError(errorData.error || 'Failed to generate OTP');
      }
    } catch (error) {
      console.error('Error generating OTP:', error);
      setEmailError('Network error. Please try again.');
    }
  };

  const handleOtpVerify = async (enteredOtp: string) => {
    if (enteredOtp === generatedOtp.toString()) {
      setStep('location'); // Go to location step
    } else {
      alert('Invalid OTP. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/users/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fullEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.otp) {
          setGeneratedOtp(data.otp.toString());
        } else if (data.otp) {
          setGeneratedOtp(data.otp.toString());
        }
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
    }
  };

  // Auto-detect location
  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const detected =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.village ||
            data?.display_name ||
            `${latitude}, ${longitude}`;

          setLocation(detected);
        } catch (err) {
          console.error('Error fetching location:', err);
          setLocation(`${latitude}, ${longitude}`);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to fetch your location. Please enter manually.');
      }
    );
  };

  const handleLocationSubmit = async () => {
    if (!location.trim()) {
      alert('Please enter your location or use auto-detect');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/by-email?email=${encodeURIComponent(fullEmail)}`
      );
      const users = await response.json();
      const existingUser = users.find((user: any) => user.email === fullEmail);
      const isNewUser = !existingUser;



      // 🔥 NEW: Save new user to database if they don't exist
      let savedUser = existingUser;
      if (isNewUser) {
        try {
          const createResponse = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: fullEmail.toLowerCase(),
              display_name: fullEmail.split('@')[0], // Use email prefix as initial name
              phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`, // Generate random phone for now
              age: 25, // Default age - will be updated in onboarding
              gender: 'other', // Default - will be updated in onboarding
              interests: [], // Will be populated in onboarding
              ml_preferences: [], // Will be populated in onboarding
              is_admin: false,
              is_brand_user: false,
              delivery_addresses: [location]
            })
          });

          if (createResponse.ok) {
            savedUser = await createResponse.json();
          } else {
            console.error('❌ Failed to save user to database');
            // Continue anyway with local data
          }
        } catch (saveError) {
          console.error('❌ Error saving user to database:', saveError);
          // Continue anyway with local data
        }
      }

      setUserData({
        _id: savedUser?._id || '',
        role: savedUser?.is_admin ? 2 : savedUser?.is_brand_user ? 1 : 0, // Calculate role from backend flags
        email: fullEmail,
        name: savedUser?.display_name || undefined,
        phoneNumber: savedUser?.phone || undefined,
        location,
        isLoggedIn: true,
        isNewUser,
        onboardingData: existingUser
          ? {
              ageRange:
                existingUser.age <= 25
                  ? 'Gen Z (18-25)'
                  : existingUser.age <= 35
                  ? 'Millennial (26-35)'
                  : 'Other',
              styleInterests: existingUser.interests || [],
              preferredFits: existingUser.ml_preferences || [],
            }
          : {},
      });

      handleClose();

      if (onContinue) onContinue(fullEmail);

      if (isNewUser) navigate('/onboarding');
      else navigate('/');
    } catch (error) {
      console.error('Error checking user existence:', error);
    }
  };

  const handleBack = () => {
    if (step === 'otp') setStep('email');
    else if (step === 'location') setStep('otp');
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setGeneratedOtp('');
    setFullEmail('');
    setLocation('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md bg-gray-800 rounded-t-3xl p-6 pb-8 animate-slide-up">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-8 pt-4">
          {step === 'email' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Login/Signup</h2>
              <div className="mb-6">
                <label className="block text-white font-medium mb-4">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className={`w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 outline-none text-base rounded-lg ${
                    emailError ? 'border-2 border-red-500' : ''
                  }`}
                />
                {emailError && <p className="text-red-400 text-sm mt-2">{emailError}</p>}
                <p className="text-gray-400 text-sm mt-3">
                  A verification code will be sent to this email address
                </p>
              </div>
              <div className="mb-8">
                <p className="text-gray-400 text-sm leading-relaxed">
                  By clicking, I accept the{' '}
                  <span className="text-white font-medium underline cursor-pointer hover:text-blue-400 transition-colors">
                    Terms & Conditions
                  </span>{' '}
                  &{' '}
                  <span className="text-white font-medium underline cursor-pointer hover:text-blue-400 transition-colors">
                    Privacy Policy
                  </span>
                </p>
              </div>
              <button
                onClick={handleContinue}
                disabled={!isEmailValid}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  isEmailValid
                    ? 'bg-gray-300 text-gray-900 hover:bg-white active:scale-95'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </>
          )}

          {step === 'otp' && (
            <OtpInput
              phoneNumber={fullEmail}
              onBack={handleBack}
              onVerify={handleOtpVerify}
              onResend={handleResendOtp}
            />
          )}

          {step === 'location' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Enter Your Location</h2>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Delhi, Mumbai"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg mb-3"
              />
              <button
                onClick={handleAutoDetectLocation}
                className="w-full py-2 mb-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
              >
                Auto Detect Location
              </button>
              <button
                onClick={handleLocationSubmit}
                className="w-full py-3 bg-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-white"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPopup;
