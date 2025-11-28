import React from 'react';

interface CategorySliderProps {
  categories: Array<{
    id: string;
    name: string;
    image: string;
  }>;
  onCategoryClick: (categoryId: string, categoryName: string) => void;
}

export const CategorySlider: React.FC<CategorySliderProps> = ({ 
  categories, 
  onCategoryClick 
}) => {
  // Duplicate categories for seamless loop
  const duplicatedCategories = [...categories, ...categories];

  return (
    <>
      <style>{`
        @keyframes scroll-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .infinite-scroll {
          animation: scroll-right 20s linear infinite;
        }

        .scroll-container {
          mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
          -webkit-mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
        }

        .category-item {
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .category-item:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
      `}</style>
      
      <div className="w-full relative">
        {/* Scrolling categories container */}
        <div className="relative w-full py-2 pb-8">
          <div className="scroll-container w-full">
            <div className="infinite-scroll flex gap-6 w-max items-start">
              {duplicatedCategories.map((category, index) => (
                <div
                  key={index}
                  className="category-item flex-shrink-0 flex flex-col items-center cursor-pointer"
                  onClick={() => onCategoryClick(category.id, category.name)}
                >
                  {/* Circular image container */}
                  <div className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden shadow-2xl mb-3">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  {/* Category name below the circle */}
                  <div className="w-full max-w-24 md:max-w-28 lg:max-w-32">
                    <p className="text-white text-xs md:text-sm font-bold text-center drop-shadow-lg truncate px-2 bg-black/30 rounded-md py-1">
                      {category.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
