import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  MapPin,
  Phone,
  CreditCard,
  FileText,
  Building,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useBrand } from "../contexts/BrandContext";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

interface StoreAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  landmark?: string;
}

interface EmergencyContact {
  name: string;
  email: string;
  number: string;
  working_hours: string;
}

interface BankDetails {
  account_number: string;
  ifsc_code: string;
  upi_id: string;
}

interface OnboardingData {
  store_addresses: StoreAddress[];
  emergency_contact: EmergencyContact;
  bank_details: BankDetails;
  return_policy: string;
  shipping_policy: string;
  store_policy: string;
}

const BrandOnboarding = () => {
  const navigate = useNavigate();
  const { brand } = useBrand();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState<OnboardingData>({
    store_addresses: [
      {
        street: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
        landmark: "",
      },
    ],
    emergency_contact: {
      name: "",
      email: brand?.email || "",
      number: "",
      working_hours: "9 AM - 6 PM",
    },
    bank_details: {
      account_number: "",
      ifsc_code: "",
      upi_id: "",
    },
    return_policy: "",
    shipping_policy: "",
    store_policy: "",
  });

  const steps = [
    {
      id: 1,
      title: "Store Addresses",
      icon: MapPin,
      description: "Add your store/warehouse locations",
    },
    {
      id: 2,
      title: "Emergency Contact",
      icon: Phone,
      description: "Primary contact information",
    },
    {
      id: 3,
      title: "Bank Details",
      icon: CreditCard,
      description: "Payment and banking information",
    },
    {
      id: 4,
      title: "Policies",
      icon: FileText,
      description: "Return, shipping, and store policies",
    },
  ];

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/brands/onboarding/data`);
      if (response.data) {
        setFormData((prev) => ({
          ...prev,
          ...response.data,
          store_addresses:
            response.data.store_addresses.length > 0
              ? response.data.store_addresses
              : prev.store_addresses,
        }));
      }
    } catch (error) {
      console.error("Error loading existing data:", error);
    }
  };

  const handleInputChange = (field: string, value: any, index?: number) => {
    if (field === "store_addresses" && index !== undefined) {
      setFormData((prev) => ({
        ...prev,
        store_addresses: prev.store_addresses.map((addr, i) =>
          i === index ? { ...addr, ...value } : addr
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const addStoreAddress = () => {
    setFormData((prev) => ({
      ...prev,
      store_addresses: [
        ...prev.store_addresses,
        {
          street: "",
          city: "",
          state: "",
          country: "India",
          pincode: "",
          landmark: "",
        },
      ],
    }));
  };

  const removeStoreAddress = (index: number) => {
    if (formData.store_addresses.length > 1) {
      setFormData((prev) => ({
        ...prev,
        store_addresses: prev.store_addresses.filter((_, i) => i !== index),
      }));
    }
  };

  const saveDraft = async () => {
    setIsSaving(true);
    setError("");
    try {
      await axios.post(`${apiUrl}/brands/onboarding/save`, {
        ...formData,
        is_draft: true,
      });
      setSuccess("Draft saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post(`${apiUrl}/brands/onboarding/save`, {
        ...formData,
        is_draft: false,
      });

      if (response.data.is_onboarded) {
        setSuccess("Onboarding completed successfully!");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to complete onboarding"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.store_addresses.every(
          (addr) =>
            addr.street &&
            addr.city &&
            addr.state &&
            addr.country &&
            addr.pincode
        );
      case 2:
        return (
          formData.emergency_contact.name &&
          formData.emergency_contact.email &&
          formData.emergency_contact.number &&
          formData.emergency_contact.working_hours
        );
      case 3:
        return (
          formData.bank_details.account_number &&
          formData.bank_details.ifsc_code &&
          formData.bank_details.upi_id
        );
      case 4:
        return (
          formData.return_policy &&
          formData.shipping_policy &&
          formData.store_policy
        );
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Building className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">
                Store Addresses
              </h3>
              <p className="text-slate-300">
                Add your store and warehouse locations
              </p>
            </div>

            {formData.store_addresses.map((address, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-2xl p-6 border border-white/10"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-white">
                    {index === 0 ? "Primary Store" : `Store ${index + 1}`}
                  </h4>
                  {formData.store_addresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStoreAddress(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={address.street}
                      onChange={(e) =>
                        handleInputChange(
                          "store_addresses",
                          { street: e.target.value },
                          index
                        )
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter street address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) =>
                        handleInputChange(
                          "store_addresses",
                          { city: e.target.value },
                          index
                        )
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) =>
                        handleInputChange(
                          "store_addresses",
                          { state: e.target.value },
                          index
                        )
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={address.country}
                      onChange={(e) =>
                        handleInputChange(
                          "store_addresses",
                          { country: e.target.value },
                          index
                        )
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={address.pincode}
                      onChange={(e) =>
                        handleInputChange(
                          "store_addresses",
                          { pincode: e.target.value },
                          index
                        )
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter pincode"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Landmark
                    </label>
                    <input
                      type="text"
                      value={address.landmark}
                      onChange={(e) =>
                        handleInputChange(
                          "store_addresses",
                          { landmark: e.target.value },
                          index
                        )
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter landmark (optional)"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addStoreAddress}
              className="w-full py-3 border-2 border-dashed border-white/30 rounded-xl text-white/70 hover:text-white hover:border-white/50 transition-colors"
            >
              + Add Another Store
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Phone className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">
                Emergency Contact
              </h3>
              <p className="text-slate-300">
                Primary contact information for support
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact.name}
                  onChange={(e) =>
                    handleInputChange("emergency_contact", {
                      ...formData.emergency_contact,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter contact name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.emergency_contact.email}
                  onChange={(e) =>
                    handleInputChange("emergency_contact", {
                      ...formData.emergency_contact,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact.number}
                  onChange={(e) =>
                    handleInputChange("emergency_contact", {
                      ...formData.emergency_contact,
                      number: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Working Hours *
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact.working_hours}
                  onChange={(e) =>
                    handleInputChange("emergency_contact", {
                      ...formData.emergency_contact,
                      working_hours: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 9 AM - 6 PM"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CreditCard className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">
                Bank Details
              </h3>
              <p className="text-slate-300">Payment and banking information</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={formData.bank_details.account_number}
                  onChange={(e) =>
                    handleInputChange("bank_details", {
                      ...formData.bank_details,
                      account_number: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  value={formData.bank_details.ifsc_code}
                  onChange={(e) =>
                    handleInputChange("bank_details", {
                      ...formData.bank_details,
                      ifsc_code: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter IFSC code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  UPI ID *
                </label>
                <input
                  type="text"
                  value={formData.bank_details.upi_id}
                  onChange={(e) =>
                    handleInputChange("bank_details", {
                      ...formData.bank_details,
                      upi_id: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter UPI ID"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">
                Store Policies
              </h3>
              <p className="text-slate-300">
                Define your return, shipping, and store policies
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Return Policy *
                </label>
                <textarea
                  value={formData.return_policy}
                  onChange={(e) =>
                    handleInputChange("return_policy", e.target.value)
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe your return policy..."
                />
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Shipping Policy *
                </label>
                <textarea
                  value={formData.shipping_policy}
                  onChange={(e) =>
                    handleInputChange("shipping_policy", e.target.value)
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe your shipping policy..."
                />
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Store Policy *
                </label>
                <textarea
                  value={formData.store_policy}
                  onChange={(e) =>
                    handleInputChange("store_policy", e.target.value)
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe your store policy..."
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to Casa, {brand?.name}!
          </h1>
          <p className="text-slate-300">
            Let's set up your brand profile to get started
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id
                      ? "bg-indigo-500 border-indigo-500 text-white"
                      : "border-white/30 text-white/50"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 ${
                      currentStep > step.id ? "bg-indigo-500" : "bg-white/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-xl">
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-500/20 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-2" />
                <p className="text-green-300">{success}</p>
              </div>
            </div>
          )}

          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={saveDraft}
                disabled={isSaving}
                className="flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Save Draft
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                  className="flex items-center px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
                >
                  Next
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={completeOnboarding}
                  disabled={!isStepValid(currentStep) || isLoading}
                  className="flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5 mr-2" />
                  )}
                  Complete Setup
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandOnboarding;
