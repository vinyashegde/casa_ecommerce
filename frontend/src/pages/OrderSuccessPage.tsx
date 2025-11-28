import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';

const OrderSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get order data from navigation state
  const { orderId, items, total, address } = location.state || {
    orderId: 'ORD' + Date.now(),
    items: [],
    total: 0,
    address: { name: 'Explore', address: 'Default Address' }
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleTrackOrder = () => {
    navigate('/profile'); // In a real app, this would go to orders page
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Success Animation */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Success Icon with Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle size={48} className="text-white" />
          </div>
          {/* Animated rings */}
          <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-20"></div>
          <div className="absolute inset-2 rounded-full border-2 border-green-300 animate-ping opacity-30" style={{ animationDelay: '0.5s' }}></div>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold mb-2 text-center">Order Placed Successfully!</h1>
        <p className="text-gray-400 text-center mb-6 max-w-sm">
          Thank you for your purchase. Your order has been confirmed and will be delivered soon.
        </p>

        {/* Order Details */}
        <div className="w-full max-w-md bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Order ID</span>
            <span className="text-sm font-mono text-blue-400">{orderId}</span>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Total Amount</span>
            <span className="text-lg font-bold text-green-400">₹{total}</span>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-start space-x-3">
              <Home size={16} className="text-blue-400 mt-1" />
              <div>
                <p className="text-sm font-medium">{address.name}</p>
                <p className="text-xs text-gray-400">{address.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="w-full max-w-md mb-8">
          <h3 className="text-sm font-medium mb-4 text-center">Order Timeline</h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-2">
                <CheckCircle size={16} className="text-white" />
              </div>
              <span className="text-xs text-green-400">Confirmed</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-700 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                <Package size={16} className="text-gray-400" />
              </div>
              <span className="text-xs text-gray-400">Processing</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-700 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                <Truck size={16} className="text-gray-400" />
              </div>
              <span className="text-xs text-gray-400">Delivered</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md space-y-3">
          <button
            onClick={handleTrackOrder}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full transition-colors"
          >
            Track Your Order
          </button>
          <button
            onClick={handleContinueShopping}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-full transition-colors border border-gray-600"
          >
            Continue Shopping
          </button>
        </div>

        {/* Estimated Delivery */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Estimated delivery: 2-5 business days based on your location
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
