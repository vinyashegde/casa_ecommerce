import React from 'react';

interface CategoryCardProps {
  id: string;
  name: string;
  image: string;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ name, image, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group relative bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Image Container */}
      <div className="relative z-10 flex flex-col items-center space-y-3">
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-600 group-hover:border-blue-400 transition-colors duration-300">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Image Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        {/* Category Name */}
        <p className="text-gray-200 group-hover:text-blue-300 font-semibold text-sm text-center transition-colors duration-300 leading-tight">
          {name}
        </p>
      </div>
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out rounded-2xl" />
    </button>
  );
};

export default CategoryCard;