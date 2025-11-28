import React, { useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Calendar, ArrowUpRight, Eye } from 'lucide-react';

const Sales = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  
  const periods = ['Today', 'This Week', 'This Month', 'This Quarter'];

  const salesTransactions = [
    { 
      id: '#12847', 
      date: 'Jan 15, 2025', 
      product: 'Wireless Headphones', 
      customer: 'Sarah Johnson',
      amount: '$129.99',
      status: 'completed'
    },
    { 
      id: '#12846', 
      date: 'Jan 15, 2025', 
      product: 'Designer Sneakers', 
      customer: 'Mike Chen',
      amount: '$89.99',
      status: 'completed'
    },
    { 
      id: '#12845', 
      date: 'Jan 14, 2025', 
      product: 'Minimalist Watch', 
      customer: 'Emma Davis',
      amount: '$199.99',
      status: 'pending'
    },
    { 
      id: '#12844', 
      date: 'Jan 14, 2025', 
      product: 'Organic Face Cream', 
      customer: 'Alex Rodriguez',
      amount: '$45.99',
      status: 'completed'
    },
    { 
      id: '#12843', 
      date: 'Jan 13, 2025', 
      product: 'Smart Fitness Tracker', 
      customer: 'Lisa Wang',
      amount: '$149.99',
      status: 'completed'
    },
    { 
      id: '#12842', 
      date: 'Jan 13, 2025', 
      product: 'Bluetooth Speaker', 
      customer: 'David Kim',
      amount: '$79.99',
      status: 'refunded'
    },
  ];

  const totalRevenue = 12450.89;
  const totalSales = 156;
  const avgOrderValue = totalRevenue / totalSales;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Sales</h1>
        <p className="text-slate-300">Track your sales performance</p>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-6 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all ${
              selectedPeriod === period
                ? 'bg-white text-slate-800 shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Total Revenue Card */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex items-center text-green-100 text-sm font-semibold">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              +18%
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-1">${totalRevenue.toLocaleString()}</h3>
          <p className="text-green-100 font-medium">Total Revenue</p>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center text-green-500 text-sm font-semibold">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                +12%
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{totalSales}</h3>
            <p className="text-slate-600 font-medium">Total Sales</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center text-green-500 text-sm font-semibold">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                +5%
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">${avgOrderValue.toFixed(0)}</h3>
            <p className="text-slate-600 font-medium">Avg Order</p>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Sales Performance</h3>
        <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Chart Coming Soon</p>
            <p className="text-slate-400 text-sm">Interactive sales chart</p>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800">Recent Sales</h3>
          <button className="text-blue-500 hover:text-blue-600 font-semibold text-sm flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>View All</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {salesTransactions.map((sale, index) => (
            <div key={index} className="bg-slate-50 rounded-2xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {sale.id.slice(-2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{sale.product}</h4>
                    <p className="text-slate-600 text-xs">{sale.customer}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{sale.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    sale.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : sale.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {sale.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{sale.date}</span>
                </span>
                <span>{sale.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-blue-500 text-white py-4 px-6 rounded-2xl font-bold hover:bg-blue-600 transition-colors shadow-lg">
          Export Data
        </button>
        <button className="bg-slate-700 text-white py-4 px-6 rounded-2xl font-bold hover:bg-slate-600 transition-colors shadow-lg">
          View Reports
        </button>
      </div>
    </div>
  );
};

export default Sales;