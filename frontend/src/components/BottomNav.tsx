import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Grid3X3, TrendingUp, ShoppingBag, Shuffle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const BottomNav: React.FC = () => {
  const { getItemCount } = useCart();
  const cartItemCount = getItemCount();

  const navItems = [
    { path: '/swipe', icon: Shuffle, label: 'Swipe' },
    { path: '/home', icon: Home, label: 'Explore' },
    { path: '/collection', icon: Grid3X3, label: 'Collection' },
    { path: '/trends', icon: TrendingUp, label: 'Trends' },
    { path: '/bag', icon: ShoppingBag, label: 'Bag', showBadge: true },
  ];

  return (
    <div className="bottom-nav fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2 z-50">
      <div className="flex justify-around items-center">
        {navItems.map(({ path, icon: Icon, label, showBadge }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `btn flex flex-col items-center py-2 px-3 rounded-lg transition-colors relative ${
                isActive
                  ? 'text-blue-400 bg-gray-800'
                  : 'text-gray-400 hover:text-gray-300'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-xs mt-1 font-medium">{label}</span>
            {showBadge && cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;