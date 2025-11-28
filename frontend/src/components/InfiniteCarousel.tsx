import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  gradient: string;
  onClick: () => void;
}

interface InfiniteCarouselProps {
  items: CarouselItem[];
  autoScrollInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

const InfiniteCarousel: React.FC<InfiniteCarouselProps> = ({
  items,
  autoScrollInterval = 5000,
  showDots = true,
  showArrows = true,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  }, [items.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  }, [items.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoScrolling(false);
    setTimeout(() => setIsAutoScrolling(true), 3000);
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (isAutoScrolling && items.length > 1) {
      intervalRef.current = setInterval(nextSlide, autoScrollInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [nextSlide, autoScrollInterval, isAutoScrolling, items.length]);

  // Pause auto-scroll on hover
  const handleMouseEnter = () => setIsAutoScrolling(false);
  const handleMouseLeave = () => setIsAutoScrolling(true);

  if (items.length === 0) return null;

  return (
    <div 
      className={`relative w-full ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Carousel Container */}
      <div 
        ref={carouselRef}
        className="relative h-64 rounded-3xl overflow-hidden group"
      >
        {/* Carousel Items */}
        <div 
          className="flex transition-transform duration-700 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className={`w-full h-full flex-shrink-0 relative ${item.gradient} bg-gradient-to-br`}
            >
              {/* Background Image */}
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
              />
              
              {/* Content Overlay */}
              <div className="absolute inset-0 bg-black/20">
                <div className="h-full flex flex-col justify-between p-6">
                  {/* Title and Subtitle */}
                  <div>
                    <h3 className="text-3xl font-black text-white mb-2 drop-shadow-lg">
                      {item.title}
                    </h3>
                    <p className="text-white/90 text-lg font-medium drop-shadow-md">
                      {item.subtitle}
                    </p>
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={item.onClick}
                    className="self-start bg-white/90 hover:bg-white text-gray-900 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 hover:scale-105 hover:shadow-xl backdrop-blur-sm"
                  >
                    {item.buttonText}
                  </button>
                </div>
              </div>

              {/* Shimmer Effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {showArrows && items.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {showDots && items.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InfiniteCarousel;