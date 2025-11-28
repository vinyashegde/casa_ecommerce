/**
 * USER DETAILS COLLECTION: New onboarding step to collect user's name, email, and gender
 * This component appears before the existing onboarding steps to gather personal information
 * Features:
 * - Form validation for name, email, and gender
 * - Consistent gray theme matching other pages
 * - Real-time validation feedback
 * - Gender selection buttons
 */
import React, { useState } from 'react';
import { User, Mail } from 'lucide-react';

interface UserDetailsStepProps {
  onContinue: (name: string, email: string, gender: string) => void;
}

const UserDetailsStep: React.FC<UserDetailsStepProps> = ({ onContinue }) => {
  // FORM STATE: Managing user input and validation errors including gender
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '', gender: '' });

  // EMAIL VALIDATION: Simple regex to validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = () => {
    const newErrors = { name: '', email: '', gender: '' };

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!gender) {
      newErrors.gender = 'Please select your gender';
    }

    setErrors(newErrors);

    if (!newErrors.name && !newErrors.email && !newErrors.gender) {
      // Convert gender to lowercase for backend compatibility
      const backendGender = gender.toLowerCase();
      onContinue(name.trim(), email.trim(), backendGender);
    }
  };

  // GENDER SELECTION: Handle gender button selection
  const handleGenderSelect = (selectedGender: string) => {
    setGender(selectedGender);
    // Clear gender error when user selects
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: '' }));
    }
  };

  const canContinue = name.trim() && email.trim() && validateEmail(email) && gender;

  // CONSISTENT THEMING: Using gray-900 background to match other pages
  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      {/* Header */}
      <div className="flex-1 px-6 py-8">
        {/* PROGRESS INDICATOR: Shows this is step 1 of 4 in onboarding */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 tracking-wider">CASA</h1>
          <div className="flex justify-center space-x-2 mb-8">
            <div className="w-3 h-3 bg-white rounded-full"></div> {/* Current step */}
            <div className="w-3 h-3 bg-white/30 rounded-full"></div>
            <div className="w-3 h-3 bg-white/30 rounded-full"></div>
            <div className="w-3 h-3 bg-white/30 rounded-full"></div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to CASA!</h2>
          <p className="text-gray-400">Let's get to know you better</p>
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <User size={20} className="mr-2 text-gray-400" />
            <span className="font-medium text-white">Full Name</span>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className={`w-full p-4 rounded-xl bg-gray-800 text-white placeholder-gray-400 border-2 transition-colors ${
              errors.name 
                ? 'border-red-500 focus:border-red-400' 
                : 'border-gray-700 focus:border-gray-600'
            } focus:outline-none`}
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-2">{errors.name}</p>
          )}
        </div>

        {/* Email Input */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Mail size={20} className="mr-2 text-gray-400" />
            <span className="font-medium text-white">Email Address</span>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className={`w-full p-4 rounded-xl bg-gray-800 text-white placeholder-gray-400 border-2 transition-colors ${
              errors.email 
                ? 'border-red-500 focus:border-red-400' 
                : 'border-gray-700 focus:border-gray-600'
            } focus:outline-none`}
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-2">{errors.email}</p>
          )}
        </div>

        {/* GENDER SELECTION */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <User size={20} className="mr-2 text-gray-400" />
            <span className="font-medium text-white">Gender</span>
          </div>
          <div className="flex space-x-3">
            {['Male', 'Female', 'Other'].map((genderOption) => (
              <button
                key={genderOption}
                type="button"
                onClick={() => handleGenderSelect(genderOption)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                  gender === genderOption
                    ? 'bg-gray-700 border-2 border-gray-600 text-white'
                    : 'bg-gray-800 border-2 border-gray-700 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {genderOption}
              </button>
            ))}
          </div>
          {errors.gender && (
            <p className="text-red-400 text-sm mt-2">{errors.gender}</p>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-4 mb-8">
          <p className="text-gray-400 text-sm">
            We'll use this information to personalize your experience and keep you updated on the latest trends.
          </p>
        </div>
      </div>

      {/* Continue Button */}
      <div className="px-6 pb-8">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
            canContinue
              ? 'bg-gray-300 text-gray-900 hover:bg-white active:scale-95'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default UserDetailsStep;
