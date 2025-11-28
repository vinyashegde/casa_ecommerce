import React from 'react';
import { useCart } from '../contexts/CartContext';
import { showErrorToast } from '../utils/toast';

interface BrandValidationErrorProps {
  onClose?: () => void;
}

const BrandValidationError: React.FC<BrandValidationErrorProps> = ({ onClose }) => {
  const { brandValidationError, switchToNewBrand, clearBrandValidationError } = useCart();

  if (!brandValidationError) return null;

  const handleSwitchBrand = async () => {
    try {
      await switchToNewBrand();
      onClose?.();
    } catch (error) {
      console.error('Error switching brand:', error);
      showErrorToast("Oops! Couldn't switch brands. Please try again.");
    }
  };

  const handleDismiss = () => {
    clearBrandValidationError();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xs w-full p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Oops! Different Brand 😊
          </h3>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-3">
          <p className="text-xs text-gray-700 mb-2">
            Shopping from <span className="font-semibold text-blue-600">{brandValidationError.newBrand.name}</span> but bag has <span className="font-semibold text-green-600">{brandValidationError.currentBrand.name}</span>.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-2 mb-2">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-900 mb-1">Current</p>
                <p className="text-xs text-green-600 font-semibold">{brandValidationError.currentBrand.name}</p>
              </div>
              <div className="text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-900 mb-1">New</p>
                <p className="text-xs text-blue-600 font-semibold">{brandValidationError.newBrand.name}</p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-600">
            Clear bag to add from {brandValidationError.newBrand.name} or keep shopping {brandValidationError.currentBrand.name}.
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleSwitchBrand}
            className="flex-1 bg-blue-600 text-white px-2 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
          >
            Switch to {brandValidationError.newBrand.name}
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 bg-gray-200 text-gray-800 px-2 py-1.5 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
          >
            Keep {brandValidationError.currentBrand.name}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandValidationError;
