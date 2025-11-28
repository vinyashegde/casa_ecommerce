/**
 * ONBOARDING STEP 1: Age Range and Style Interests Collection
 *
 * THEME UPDATE: Changed from purple/orange gradient to consistent gray theme
 * PROGRESS UPDATE: Updated progress indicators to reflect new 4-step flow
 *
 * Changes made:
 * - Background: purple gradient → gray-900 (consistent with app theme)
 * - Buttons: purple/orange → gray color scheme
 * - Progress: Updated to show step 2 of 4 (after UserDetailsStep)
 * - Icons: Added gray-400 color for better visual hierarchy
 */
import React, { useState } from 'react';
import { User } from 'lucide-react';

interface OnboardingStep1Props {
  onContinue: (ageRange: string, styleInterests: string[]) => void;
}

const OnboardingStep1: React.FC<OnboardingStep1Props> = ({ onContinue }) => {
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>('');
  const [selectedStyleInterests, setSelectedStyleInterests] = useState<string[]>([]);

  const ageRanges = [
    'Gen Z (18-25)',
    'Millennial (26-35)',
    'Other'
  ];

  const styleInterests = [
    'Streetwear',
    'Vintage',
    'Minimalist',
    'Boho',
    'Y2K',
    'Grunge',
    'Preppy',
    'Athleisure'
  ];

  const handleStyleInterestToggle = (interest: string) => {
    setSelectedStyleInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(item => item !== interest);
      } else if (prev.length < 5) { // Max 5 selections as per "pick 3-5"
        return [...prev, interest];
      }
      return prev;
    });
  };

  const handleContinue = () => {
    if (selectedAgeRange && selectedStyleInterests.length >= 3) {
      onContinue(selectedAgeRange, selectedStyleInterests);
    }
  };

  const canContinue = selectedAgeRange && selectedStyleInterests.length >= 3;

  // THEME CONSISTENCY: Changed from purple gradient to gray-900 background
  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      {/* Header */}
      <div className="flex-1 px-6 py-8">
        {/* UPDATED PROGRESS: Now shows step 2 of 4 (after UserDetailsStep) */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 tracking-wider">CASA</h1>
          <div className="flex justify-center space-x-2 mb-8">
            <div className="w-3 h-3 bg-white rounded-full"></div> {/* UserDetails completed */}
            <div className="w-3 h-3 bg-white rounded-full"></div> {/* Current step */}
            <div className="w-3 h-3 bg-white/30 rounded-full"></div> {/* Preferences step */}
            <div className="w-3 h-3 bg-white/30 rounded-full"></div> {/* Success step */}
          </div>
          <h2 className="text-2xl font-bold mb-2">Tell us about you</h2>
          <p className="text-gray-400">Help us personalize your feed</p>
        </div>

        {/* Age Range Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            {/* VISUAL IMPROVEMENT: Added gray-400 color to icon for better hierarchy */}
            <User size={20} className="mr-2 text-gray-400" />
            <span className="font-medium">Age Range</span>
          </div>
          <div className="space-y-3">
            {ageRanges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedAgeRange(range)}
                className={`w-full p-4 rounded-xl text-left font-medium transition-all border-2 ${
                  selectedAgeRange === range
                    ? 'bg-gray-700 border-gray-600 text-white' // Selected state
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' // Default state
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Style Interests Section */}
        <div className="mb-8">
          <div className="mb-4">
            <span className="font-medium">Style Interests (pick 3-5)</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {styleInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => handleStyleInterestToggle(interest)}
                className={`p-4 rounded-xl font-medium transition-all border-2 ${
                  selectedStyleInterests.includes(interest)
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-2">
            {selectedStyleInterests.length}/5 selected
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

export default OnboardingStep1;
