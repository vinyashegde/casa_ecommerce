import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, X } from 'lucide-react';

interface SwipeTutorialOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
}

const SwipeTutorialOverlay: React.FC<SwipeTutorialOverlayProps> = ({
  isVisible,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      if (currentStep === 0) {
        setCurrentStep(1);
      } else {
        onComplete();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isVisible, currentStep, onComplete]);

  const handleSkip = () => {
    onComplete();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative max-w-sm mx-4 bg-gray-900 rounded-2xl p-6 text-white"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Skip button */}
            <motion.button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={16} className="m-0" />
            </motion.button>

            <div className="text-center">
              <motion.h2 
                className="text-xl font-bold mb-4"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                How to Swipe
              </motion.h2>

              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-center space-x-4 mb-4">
                      <motion.div
                        className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-500 rounded-lg"
                        animate={{ x: [-20, 0] }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                      >
                        <ChevronLeft className="text-red-500" size={24} />
                        <span className="text-red-500 font-semibold">Skip</span>
                      </motion.div>
                    </div>
                    <p className="text-gray-300">
                      Swipe <span className="text-red-400 font-semibold">left</span> to skip products you don't like
                    </p>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-center space-x-4 mb-4">
                      <motion.div
                        className="flex items-center space-x-2 p-3 bg-green-500/20 border border-green-500 rounded-lg"
                        animate={{ x: [20, 0] }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                      >
                        <span className="text-green-500 font-semibold">Like</span>
                        <ChevronRight className="text-green-500" size={24} />
                        <Heart className="text-green-500 fill-current" size={20} />
                      </motion.div>
                    </div>
                    <p className="text-gray-300">
                      Swipe <span className="text-green-400 font-semibold">right</span> to add products to your wishlist
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress dots */}
              <div className="flex justify-center space-x-2 mt-6">
                {[0, 1].map((step) => (
                  <motion.div
                    key={step}
                    className={`w-2 h-2 rounded-full ${
                      currentStep === step ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                    animate={{
                      scale: currentStep === step ? [1, 1.2, 1] : 1
                    }}
                    transition={{ duration: 0.5 }}
                  />
                ))}
              </div>

              <motion.p 
                className="text-xs text-gray-500 mt-4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                This overlay will disappear automatically
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SwipeTutorialOverlay;