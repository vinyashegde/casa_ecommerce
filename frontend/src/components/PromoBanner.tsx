import React from 'react';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';

interface PromoBannerProps {
  type: 'offer' | 'deal';
  title: string;
  subtitle: string;
  discount?: string;
  buttonText: string;
  backgroundImage: string;
  gradientFrom: string;
  gradientTo: string;
  onClick: () => void;
}

const PromoBanner: React.FC<PromoBannerProps> = ({
  type,
  title,
  subtitle,
  discount,
  buttonText,
  backgroundImage,
  gradientFrom,
  gradientTo,
  onClick,
}) => {
  const Icon = type === 'offer' ? Sparkles : Zap;

  return (
    <div className="relative rounded-3xl overflow-hidden h-40 cursor-pointer group" onClick={onClick}>
      {/* Background Image */}
      <img
        src={backgroundImage}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      
      {/* Gradient Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-90 group-hover:opacity-95 transition-opacity duration-300`}
      />
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-repeat" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 p-6 h-full flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Icon 
              size={20} 
              className="text-white animate-pulse"
            />
            <span className="text-white/90 text-sm font-semibold uppercase tracking-wider">
              {type === 'offer' ? 'Special Offer' : 'Flash Deal'}
            </span>
          </div>
          
          <h3 className="text-white font-bold text-xl mb-1 leading-tight">
            {title}
          </h3>
          
          <p className="text-white/80 text-sm font-medium">
            {subtitle}
          </p>
          
          {discount && (
            <div className="mt-2">
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                {discount}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end">
          <button className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-2xl font-semibold text-sm border border-white/30 hover:bg-white/30 hover:scale-105 transition-all duration-300 flex items-center space-x-2 group/btn">
            <span>{buttonText}</span>
            <ArrowRight 
              size={16} 
              className="group-hover/btn:translate-x-1 transition-transform duration-300"
            />
          </button>
        </div>
      </div>
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out" />
    </div>
  );
};

export default PromoBanner;