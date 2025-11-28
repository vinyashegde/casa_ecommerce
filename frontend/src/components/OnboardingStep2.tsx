/**
 * ONBOARDING STEP 2: Preferred Fits Collection
 *
 * THEME UPDATE: Changed from purple/orange gradient to consistent gray theme
 * PROGRESS UPDATE: Updated progress indicators to reflect new 4-step flow
 *
 * Changes made:
 * - Background: purple gradient → gray-900 (consistent with app theme)
 * - Buttons: purple/orange → gray color scheme matching other components
 * - Progress: Updated to show step 3 of 4 (final onboarding step)
 * - Icons: Added gray-400 color for visual consistency
 */
import React, { useState } from 'react';
import { Shirt } from 'lucide-react';

interface OnboardingStep2Props {
  onContinue: (preferredFits: string[]) => void;
}

const OnboardingStep2: React.FC<OnboardingStep2Props> = ({ onContinue }) => {
  const [selectedFits, setSelectedFits] = useState<string[]>([]);

  const fitOptions = [
    'Oversized',
    'Fitted',
    'Loose',
    'Cropped',
    'Baggy',
    'Slim'
  ];

  const handleFitToggle = (fit: string) => {
    setSelectedFits(prev => {
      if (prev.includes(fit)) {
        return prev.filter(item => item !== fit);
      } else {
        return [...prev, fit];
      }
    });
  };

  const handleContinue = () => {
    if (selectedFits.length > 0) {
      onContinue(selectedFits);
    }
  };

  const canContinue = selectedFits.length > 0;

  // THEME CONSISTENCY: Changed from purple gradient to gray-900 background
  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      {/* Header */}
      <div className="flex-1 px-6 py-8">
        {/* UPDATED PROGRESS: Now shows step 3 of 4 (final onboarding step) */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 tracking-wider">CASA</h1>
          <div className="flex justify-center space-x-2 mb-8">
            <div className="w-3 h-3 bg-white rounded-full"></div> {/* UserDetails completed */}
            <div className="w-3 h-3 bg-white rounded-full"></div> {/* Age/Interests completed */}
            <div className="w-3 h-3 bg-white rounded-full"></div> {/* Current step */}
            <div className="w-3 h-3 bg-white/30 rounded-full"></div> {/* Success step */}
          </div>
          <h2 className="text-2xl font-bold mb-2">Your Style Preferences</h2>
          <p className="text-gray-400">What fits do you love?</p>
        </div>

        {/* Preferred Fits Section */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Shirt size={20} className="mr-2 text-gray-400" />
            <span className="font-medium">Preferred Fits</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {fitOptions.map((fit) => (
              <button
                key={fit}
                onClick={() => handleFitToggle(fit)}
                className={`p-6 rounded-xl font-medium text-lg transition-all border-2 ${
                  selectedFits.includes(fit)
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {fit}
              </button>
            ))}
          </div>
          {selectedFits.length > 0 && (
            <p className="text-sm text-gray-400 mt-4">
              {selectedFits.length} fit{selectedFits.length !== 1 ? 's' : ''} selected
            </p>
          )}
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

export default OnboardingStep2;
