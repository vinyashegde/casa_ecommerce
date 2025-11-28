/**
 * REGISTRATION SUCCESS POPUP: Shows after user completes onboarding
 * Features:
 * - Personalized welcome message using user's name
 * - Feature highlights to educate new users
 * - Smooth slide-up animation
 * - Consistent gray theme with app design
 * - Call-to-action to start exploring the app
 */
import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface RegistrationSuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string; // Optional user name for personalization
}

const RegistrationSuccessPopup: React.FC<RegistrationSuccessPopupProps> = ({ 
  isOpen, 
  onClose, 
  userName 
}) => {
  if (!isOpen) return null;

  // MODAL OVERLAY: Full-screen overlay with backdrop blur
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose} />

      {/* SUCCESS POPUP: Main popup container with slide-up animation */}
      <div className="relative w-full max-w-md mx-4 bg-gray-800 rounded-3xl p-8 animate-slide-up">
        {/* SUCCESS ICON AND MESSAGE */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
            <CheckCircle size={40} className="text-white" />
          </div>
          {/* PERSONALIZED WELCOME: Uses collected user name if available */}
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome to CASA{userName ? `, ${userName}!` : '!'}
          </h2>
          <p className="text-gray-400 text-base leading-relaxed">
            Your account has been created successfully. You're all set to discover amazing fashion trends!
          </p>
        </div>

        {/* FEATURE HIGHLIGHTS: Educate new users about app capabilities */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-gray-300 text-sm">Personalized fashion recommendations</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-gray-300 text-sm">Swipe through curated collections</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-gray-300 text-sm">Save your favorite items</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-gray-300 hover:bg-white text-gray-900 font-semibold py-4 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center space-x-2"
        >
          <span>Start Exploring</span>
          <ArrowRight size={20} />
        </button>
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

export default RegistrationSuccessPopup;
