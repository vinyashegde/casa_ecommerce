import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Globe,
  Camera,
  Plus,
  X,
  AlertCircle,
  Check,
  MapPin,
  Phone,
  Sparkles,
  Building2,
  CreditCard,
  Users,
  ArrowLeft,
} from "lucide-react";

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

interface FormData {
  name: string;
  logo_url: string;
  description: string;
  website: string;
  domain: string;
  social_links: string[];
  email: string;
  password: string;
  store_addresses: StoreAddress[];
  emergency_contact: EmergencyContact;
  bank_details: BankDetails;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const BrandSignup = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    logo_url: "",
    description: "",
    website: "",
    domain: "",
    social_links: [""],
    email: "",
    password: "",
    store_addresses: [
      {
        street: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
        landmark: "",
      },
    ],
    emergency_contact: {
      name: "",
      email: "",
      number: "",
      working_hours: "",
    },
    bank_details: {
      account_number: "",
      ifsc_code: "",
      upi_id: "",
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Brand name is required";
    if (!formData.logo_url.trim()) newErrors.logo_url = "Logo URL is required";
    if (!formData.domain.trim()) newErrors.domain = "Domain is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Store address validation
    formData.store_addresses.forEach((addr, idx) => {
      if (!addr.street) newErrors[`store_${idx}_street`] = "Street is required";
      if (!addr.city) newErrors[`store_${idx}_city`] = "City is required";
      if (!addr.state) newErrors[`store_${idx}_state`] = "State is required";
      if (!addr.country)
        newErrors[`store_${idx}_country`] = "Country is required";
      if (!addr.pincode)
        newErrors[`store_${idx}_pincode`] = "Pincode is required";
    });

    // Emergency contact validation
    if (!formData.emergency_contact.name)
      newErrors.emergency_name = "Name is required";
    if (
      !formData.emergency_contact.email ||
      !validateEmail(formData.emergency_contact.email)
    )
      newErrors.emergency_email = "Valid email is required";
    if (!formData.emergency_contact.number)
      newErrors.emergency_number = "Number is required";
    if (!formData.emergency_contact.working_hours)
      newErrors.emergency_hours = "Working hours are required";

    // Bank details validation
    if (!formData.bank_details.account_number)
      newErrors.bank_acc = "Account number is required";
    if (!formData.bank_details.ifsc_code)
      newErrors.bank_ifsc = "IFSC code is required";
    if (!formData.bank_details.upi_id)
      newErrors.bank_upi = "UPI ID is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleStoreChange = (
    index: number,
    field: keyof StoreAddress,
    value: string
  ) => {
    const newStores = [...formData.store_addresses];
    newStores[index][field] = value;
    setFormData((prev) => ({ ...prev, store_addresses: newStores }));
  };

  const handleEmergencyChange = (
    field: keyof EmergencyContact,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      emergency_contact: { ...prev.emergency_contact, [field]: value },
    }));
  };

  const handleBankChange = (field: keyof BankDetails, value: string) => {
    setFormData((prev) => ({
      ...prev,
      bank_details: { ...prev.bank_details, [field]: value },
    }));
  };

  const handleSocialLinkChange = (index: number, value: string) => {
    const links = [...formData.social_links];
    links[index] = value;
    setFormData((prev) => ({ ...prev, social_links: links }));
  };

  const addSocialLink = () =>
    setFormData((prev) => ({
      ...prev,
      social_links: [...prev.social_links, ""],
    }));

  const removeSocialLink = (index: number) => {
    if (formData.social_links.length > 1) {
      setFormData((prev) => ({
        ...prev,
        social_links: prev.social_links.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 Form submitted with data:", formData);

    if (!validateForm()) {
      console.log("❌ Form validation failed:", errors);
      return;
    }

    console.log("✅ Form validation passed, submitting...");
    setIsLoading(true);
    try {
      const cleanedData = {
        ...formData,
        social_links: formData.social_links.filter(
          (link) => link.trim() !== ""
        ),
      };
      console.log("📤 Sending data to backend:", cleanedData);

      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const res = await fetch(`${apiUrl}/brands/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      console.log("📥 Backend response status:", res.status);

      if (res.ok) {
        console.log("✅ Brand created successfully");
        setIsSuccess(true);
      } else {
        const data = await res.json();
        console.log("❌ Backend error:", data);
        setErrors({ general: data.message || "Registration failed" });
      }
    } catch (error) {
      console.log("❌ Network error:", error);
      setErrors({ general: "Network error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6 py-8 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="w-full max-w-md text-center relative z-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-8 shadow-2xl shadow-green-500/25 animate-scale-in">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Registration Successful!
          </h1>
          <p className="text-white/70 mb-8 text-lg">
            Your brand account has been created successfully!
          </p>
          <Link
            to="/login"
            className="inline-block w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-2xl font-bold hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-2xl hover:shadow-indigo-500/25 hover:scale-105"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-6 py-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-500/20 to-cyan-500/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="w-full max-w-4xl mx-auto relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl mb-6 shadow-2xl shadow-indigo-500/25">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Brand Signup
          </h1>
          <p className="text-white/70 text-lg">
            Create your brand account and start managing your products
          </p>
        </div>

        {/* Back to Login Link */}
        <div className="text-center mb-6">
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 text-indigo-300 hover:text-indigo-200 font-medium transition-colors duration-300 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20 backdrop-blur-xl">
          {errors.general && (
            <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-2xl p-4 flex items-start space-x-3 mb-6 animate-scale-in">
              <AlertCircle className="w-6 h-6 text-red-400 mt-0.5" />
              <p className="text-red-300 text-sm font-medium">
                {errors.general}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Brand Info Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Brand Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white/90">
                    Brand Name *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter brand name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                      />
                    </div>
                  </div>
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-2 animate-scale-in">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white/90">
                    Logo URL *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative">
                      <Camera className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                      <input
                        type="url"
                        name="logo_url"
                        placeholder="https://example.com/logo.png"
                        value={formData.logo_url}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                      />
                    </div>
                  </div>
                </div>
                {errors.logo_url && (
                  <p className="text-red-400 text-sm mt-2 animate-scale-in">
                    {errors.logo_url}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-white/90">
                  Description
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  <div className="relative">
                    <textarea
                      name="description"
                      placeholder="Describe your brand..."
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full pl-4 pr-4 py-4 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-white/90">
                  Website
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input
                      type="url"
                      name="website"
                      placeholder="https://yourwebsite.com"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-white/90">
                  Domain *
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input
                      type="text"
                      name="domain"
                      placeholder="yourbrand.com"
                      value={formData.domain}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                    />
                  </div>
                </div>
                {errors.domain && (
                  <p className="text-red-400 text-sm mt-2 animate-scale-in">
                    {errors.domain}
                  </p>
                )}
              </div>

              {/* Display all validation errors for debugging */}
              {Object.keys(errors).length > 0 && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-4">
                  <h3 className="text-red-300 font-semibold mb-2">
                    Validation Errors:
                  </h3>
                  <ul className="text-red-300 text-sm space-y-1">
                    {Object.entries(errors).map(([key, value]) => (
                      <li key={key}>
                        • {key}: {value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Social Links Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-pink-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Social Links</h2>
              </div>

              {formData.social_links.map((link, i) => (
                <div key={i} className="flex gap-3">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative">
                      <input
                        type="url"
                        value={link}
                        onChange={(e) =>
                          handleSocialLinkChange(i, e.target.value)
                        }
                        placeholder="https://social-media.com/yourprofile"
                        className="w-full pl-4 pr-4 py-4 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                      />
                    </div>
                  </div>
                  {formData.social_links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSocialLink(i)}
                      className="w-12 h-12 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 rounded-2xl hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 flex items-center justify-center hover:scale-110"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSocialLink}
                className="w-full py-4 glass text-white/70 hover:text-white rounded-2xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-3 font-medium hover:scale-105 group"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Add Social Link</span>
              </button>
            </div>

            {/* Store Address Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Store Address</h2>
              </div>

              {formData.store_addresses.map((store, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 glass rounded-2xl border border-white/10"
                >
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white/90">
                      Street *
                    </label>
                    <input
                      type="text"
                      placeholder="Street address"
                      value={store.street}
                      onChange={(e) =>
                        handleStoreChange(idx, "street", e.target.value)
                      }
                      className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white/90">
                      City *
                    </label>
                    <input
                      type="text"
                      placeholder="City"
                      value={store.city}
                      onChange={(e) =>
                        handleStoreChange(idx, "city", e.target.value)
                      }
                      className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white/90">
                      State *
                    </label>
                    <input
                      type="text"
                      placeholder="State"
                      value={store.state}
                      onChange={(e) =>
                        handleStoreChange(idx, "state", e.target.value)
                      }
                      className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white/90">
                      Country *
                    </label>
                    <input
                      type="text"
                      placeholder="Country"
                      value={store.country}
                      onChange={(e) =>
                        handleStoreChange(idx, "country", e.target.value)
                      }
                      className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white/90">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={store.pincode}
                      onChange={(e) =>
                        handleStoreChange(idx, "pincode", e.target.value)
                      }
                      className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-white/90">
                      Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="Landmark"
                      value={store.landmark}
                      onChange={(e) =>
                        handleStoreChange(idx, "landmark", e.target.value)
                      }
                      className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Emergency Contact Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                  <Phone className="w-4 h-4 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Emergency Contact
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 glass rounded-2xl border border-white/10">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white/90">
                    Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Contact name"
                    value={formData.emergency_contact.name}
                    onChange={(e) =>
                      handleEmergencyChange("name", e.target.value)
                    }
                    className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white/90">
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="contact@email.com"
                    value={formData.emergency_contact.email}
                    onChange={(e) =>
                      handleEmergencyChange("email", e.target.value)
                    }
                    className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white/90">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.emergency_contact.number}
                    onChange={(e) =>
                      handleEmergencyChange("number", e.target.value)
                    }
                    className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white/90">
                    Working Hours *
                  </label>
                  <input
                    type="text"
                    placeholder="9 AM - 6 PM"
                    value={formData.emergency_contact.working_hours}
                    onChange={(e) =>
                      handleEmergencyChange("working_hours", e.target.value)
                    }
                    className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Bank Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 glass rounded-2xl border border-white/10">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white/90">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    placeholder="Account number"
                    value={formData.bank_details.account_number}
                    onChange={(e) =>
                      handleBankChange("account_number", e.target.value)
                    }
                    className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white/90">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    placeholder="IFSC code"
                    value={formData.bank_details.ifsc_code}
                    onChange={(e) =>
                      handleBankChange("ifsc_code", e.target.value)
                    }
                    className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white/90">
                    UPI ID *
                  </label>
                  <input
                    type="text"
                    placeholder="UPI ID"
                    value={formData.bank_details.upi_id}
                    onChange={(e) => handleBankChange("upi_id", e.target.value)}
                    className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                  />
                </div>
              </div>
            </div>

            {/* Account Credentials Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                  <Lock className="w-4 h-4 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Account Credentials
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white/90">
                    Email *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                      <input
                        type="email"
                        name="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                      />
                    </div>
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-2 animate-scale-in">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white/90">
                    Password *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-4 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors duration-300"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-2 animate-scale-in">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-5 rounded-2xl font-bold hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-2xl hover:shadow-indigo-500/25 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative flex items-center justify-center space-x-3">
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Create Account</span>
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BrandSignup;
