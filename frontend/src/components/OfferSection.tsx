import React from "react";
import { Clock, Flame, Star } from "lucide-react";
import DynamicImage from "./DynamicImage";

interface Offer {
  id: string;
  title: string;
  subtitle: string;
  discount: string;
  timeLeft?: string;
  image?: string;
  imageTag?: string;
  fallbackImage?: string;
  gradient: string;
  isHot?: boolean;
  onClick: () => void;
}

interface OfferSectionProps {
  title: string;
  offers: Offer[];
  icon?: React.ReactNode;
  className?: string;
}

const OfferSection: React.FC<OfferSectionProps> = ({
  title,
  offers,
  icon,
  className = "",
}) => {
  return (
    <div className={`px-4 mb-12 ${className}`}>
      <div className="flex items-center mb-8">
        {icon && <span className="mr-3 text-2xl">{icon}</span>}
        <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 drop-shadow">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {offers.map((offer, index) => (
          <div
            key={offer.id}
            className="relative group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <button
              onClick={offer.onClick}
              className="w-full rounded-3xl p-6 relative overflow-hidden h-48 transition-all duration-500 hover:scale-105 hover:shadow-2xl border-2 border-white/20 hover:border-orange-400/60"
            >
              {/* Dynamic Background Image */}
              <div className="absolute inset-0">
                {offer.imageTag ? (
                  <DynamicImage
                    tag={offer.imageTag}
                    fallbackSrc={offer.fallbackImage || offer.image}
                    alt={offer.title}
                    className="w-full h-full"
                    objectFit="cover"
                    priority={index < 2}
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${offer.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                )}
              </div>
              {/* Dark Overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40 hover:bg-black/30 transition-all duration-300" />
              {/* Hot Badge */}
              {offer.isHot && (
                <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 animate-pulse">
                  <Flame size={12} />
                  <span>HOT</span>
                </div>
              )}

              {/* Time Left Badge */}
              {offer.timeLeft && (
                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <Clock size={12} />
                  <span>{offer.timeLeft}</span>
                </div>
              )}

              {/* Content */}
              <div className="flex flex-col h-full justify-between z-10 relative">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1 drop-shadow-lg">
                    {offer.title}
                  </h3>
                  <p className="text-white/90 text-sm mb-2 drop-shadow">
                    {offer.subtitle}
                  </p>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full inline-block">
                    <span className="text-white font-black text-xl drop-shadow">
                      {offer.discount}
                    </span>
                  </div>
                </div>

                {/* Product Image - now as a circular overlay
                <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full overflow-hidden shadow-xl border-4 border-white/80 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 bg-white/90">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                  />
                </div> */}
              </div>

              {/* Shimmer Effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OfferSection;
