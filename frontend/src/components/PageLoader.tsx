import React from 'react';

interface PageLoaderProps {
  text?: string;
  overlay?: boolean;
}

const PageLoader: React.FC<PageLoaderProps> = ({ 
  text = "Loading...", 
  overlay = false 
}) => {
  const containerClasses = overlay 
    ? "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" 
    : "min-h-screen bg-gray-900";

  return (
    <div className={`${containerClasses} flex items-center justify-center`}>
      <div className="text-center space-y-4">
        {/* Animated logo/icon */}
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-2 border-purple-500/20 rounded-full"></div>
          <div className="absolute inset-2 border-2 border-purple-500 border-t-transparent rounded-full animate-spin animate-reverse"></div>
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <h3 className="text-white font-medium">{text}</h3>
          <div className="flex justify-center space-x-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;