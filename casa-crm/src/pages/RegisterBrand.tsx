import React, { useState } from 'react';
import { Camera, Upload, Check, AlertCircle } from 'lucide-react';

const RegisterBrand = () => {
  const [formData, setFormData] = useState({
    brandName: '',
    description: '',
    website: '',
    category: '',
    contactEmail: '',
    phone: '',
  });

  const [step, setStep] = useState(1);

  const categories = [
    'Fashion & Apparel',
    'Electronics & Tech',
    'Beauty & Cosmetics',
    'Sports & Fitness',
    'Home & Garden',
    'Food & Beverage',
    'Health & Wellness',
    'Automotive',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Register Brand</h1>
        <p className="text-slate-300">Add your brand to our marketplace</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
              stepNumber <= step ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-400'
            }`}>
              {stepNumber < step ? <Check className="w-5 h-5" /> : stepNumber}
            </div>
            {stepNumber < 3 && (
              <div className={`w-8 h-1 mx-2 ${
                stepNumber < step ? 'bg-blue-500' : 'bg-slate-600'
              }`}></div>
            )}
          </div>
        ))}
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-3xl p-6 shadow-xl">
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Brand Name *
              </label>
              <input
                type="text"
                name="brandName"
                value={formData.brandName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your brand and what makes it unique..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yourbrand.com"
              />
            </div>
          </div>
        )}

        {/* Step 2: Category & Contact */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Category & Contact</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@yourbrand.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        )}

        {/* Step 3: Brand Assets */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Brand Assets</h2>
            
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Brand Logo *
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">Upload your logo</h3>
                <p className="text-slate-500 text-sm mb-4">PNG, JPG or SVG up to 2MB</p>
                <button className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition-colors">
                  Choose File
                </button>
              </div>
            </div>

            {/* Brand Images */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Brand Images (Optional)
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500 text-xs">Upload image</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Registration Terms</h4>
                  <p className="text-blue-700 text-sm">
                    By registering your brand, you agree to our marketplace terms and conditions. 
                    Your brand will be reviewed within 24-48 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex space-x-4 pt-6">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3 px-6 bg-slate-200 text-slate-700 rounded-2xl font-semibold hover:bg-slate-300 transition-colors"
            >
              Previous
            </button>
          )}
          <button
            onClick={step === 3 ? () => alert('Brand registered successfully!') : nextStep}
            className="flex-1 py-3 px-6 bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-600 transition-colors"
          >
            {step === 3 ? 'Submit Registration' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterBrand;