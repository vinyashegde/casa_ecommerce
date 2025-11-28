import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import PageLoader from './PageLoader';
import { useLoading } from '../contexts/LoadingContext';

const LoadingDemo: React.FC = () => {
  const [showSpinner, setShowSpinner] = useState(false);
  const [showPageLoader, setShowPageLoader] = useState(false);
  const { showPageLoader: showGlobalLoader, hidePageLoader, isPageLoading } = useLoading();

  const simulateLoading = async () => {
    setShowSpinner(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setShowSpinner(false);
  };

  const simulatePageLoading = () => {
    setShowPageLoader(true);
    setTimeout(() => setShowPageLoader(false), 3000);
  };

  const simulateGlobalLoading = () => {
    showGlobalLoader('Loading global data...');
    setTimeout(() => hidePageLoader(), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center">Loading Components Demo</h1>
        
        {/* Loading Spinners */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Loading Spinners</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <LoadingSpinner size="sm" color="blue" />
              <span>Small Blue Spinner</span>
            </div>
            <div className="flex items-center space-x-4">
              <LoadingSpinner size="md" color="purple" />
              <span>Medium Purple Spinner</span>
            </div>
            <div className="flex items-center space-x-4">
              <LoadingSpinner size="lg" color="white" text="Loading..." />
              <span>Large White Spinner with text</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-800 p-4 rounded-lg space-y-3">
          <h2 className="text-lg font-semibold mb-4">Test Loading States</h2>
          
          <button
            onClick={simulateLoading}
            disabled={showSpinner}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
          >
            {showSpinner ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner size="sm" color="white" />
                <span>Loading...</span>
              </div>
            ) : (
              'Simulate Button Loading'
            )}
          </button>

          <button
            onClick={simulatePageLoading}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Show Page Loader
          </button>

          <button
            onClick={simulateGlobalLoading}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            Show Global Loader
          </button>
        </div>

        {/* Usage Examples */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Usage Examples</h2>
          <div className="text-sm text-gray-300 space-y-2">
            <p><strong>Splash Screen:</strong> Shown on app startup</p>
            <p><strong>Page Loader:</strong> Full page loading overlay</p>
            <p><strong>Loading Spinner:</strong> Inline loading indicators</p>
            <p><strong>Global Context:</strong> App-wide loading management</p>
          </div>
        </div>

        {/* Status */}
        {isPageLoading && (
          <div className="bg-yellow-600 p-3 rounded-lg text-center">
            Global loading is active
          </div>
        )}
      </div>

      {/* Local Page Loader */}
      {showPageLoader && (
        <PageLoader text="Local page loading..." overlay />
      )}
    </div>
  );
};

export default LoadingDemo;