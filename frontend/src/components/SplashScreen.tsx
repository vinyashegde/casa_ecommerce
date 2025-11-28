import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinished: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinished, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    // Animation phases
    const phases = [
      { delay: 0, phase: 0 },
      { delay: 500, phase: 1 },
      { delay: 1000, phase: 2 },
    ];

    phases.forEach(({ delay, phase }) => {
      setTimeout(() => setAnimationPhase(phase), delay);
    });

    // Final fade out
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onFinished();
      }, 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [onFinished, duration]);

  return (
    <div
      className={`
        fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[413px] px-4
        transition-opacity duration-500
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{ 
        top: '120px', // Start below header and tabs
        height: 'calc(100vh - 200px)' // Leave space for bottom navigation
      }}
    >
      {/* Simple container with just text */}
      <div className="relative w-full h-full flex flex-col items-center justify-center px-6">
          {/* CASA Text */}
          <div className={`
            transition-all duration-1000 transform
            ${animationPhase >= 0 ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}
          `}>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white text-center tracking-tight drop-shadow-2xl">
              CASA
            </h1>
          </div>
          
          {/* Subtitle */}
          <div className={`
            mt-4 transition-all duration-1000 delay-300
            ${animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}>
            <p className="text-white/90 text-sm sm:text-base font-medium text-center tracking-wide drop-shadow-lg">
              Where Fashion Meets Technology
            </p>
          </div>

          {/* Loading Animation */}
          <div className={`
            mt-6 transition-all duration-1000 delay-500
            ${animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}>
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-white rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
                // hi
              ))}
            </div>
          </div>
      </div>
    </div>
  );
};

export default SplashScreen;