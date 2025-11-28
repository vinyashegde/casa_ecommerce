import { useState, useEffect } from "react";
import {
  Edit,
  Save,
  X,
  Phone,
  CreditCard,
  FileText,
  Globe,
  Mail,
  Building,
  Calendar,
  AlertCircle,
  Check,
  Loader2,
  Trash2,
  Upload,
  Image,
  ExternalLink,
} from "lucide-react";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

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

interface BrandProfileData {
  _id: string;
  name: string;
  logo_url: string;
  description?: string;
  website?: string;
  domain: string;
  email: string;
  social_links: string[];
  gender: string;
  is_active: boolean;
  is_onboarded: boolean;
  store_addresses: StoreAddress[];
  emergency_contact: EmergencyContact;
  bank_details: BankDetails;
  return_policy?: string;
  shipping_policy?: string;
  store_policy?: string;
  created_at: string;
  updated_at?: string;
}

const BrandProfile = () => {
  const [profileData, setProfileData] = useState<BrandProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [isValidatingLogo, setIsValidatingLogo] = useState(false);

  const [editData, setEditData] = useState<Partial<BrandProfileData>>({});

  useEffect(() => {
    // Check if user is authenticated before loading profile data
    const token = localStorage.getItem("brandToken");
    const brandData = localStorage.getItem("brandData");

    if (!token || !brandData) {
      setError("Please log in to view your profile");
      setIsLoading(false);
      return;
    }

    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem("brandToken");

      // Ensure authorization header is set
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      const response = await axios.get(`${apiUrl}/brands/profile`);
      setProfileData(response.data);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
      };

      if (axiosError.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
        // Clear invalid token
        localStorage.removeItem("brandToken");
        localStorage.removeItem("brandData");
        axios.defaults.headers.common["Authorization"] = "";
      } else {
        setError(
          axiosError.response?.data?.message || "Failed to load profile data"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = () => {
    if (profileData) {
      setEditData({ ...profileData });
      setIsEditing(true);
      setError("");
      setSuccess("");
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
    setError("");
    setSuccess("");
  };

  const handleInputChange = (field: string, value: unknown, index?: number) => {
    if (field === "store_addresses" && index !== undefined) {
      setEditData((prev) => ({
        ...prev,
        store_addresses: prev.store_addresses?.map((addr, i) =>
          i === index ? { ...addr, ...(value as Partial<StoreAddress>) } : addr
        ),
      }));
    } else if (field === "social_links") {
      setEditData((prev) => ({
        ...prev,
        social_links: value as string[],
      }));
    } else {
      setEditData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const addStoreAddress = () => {
    setEditData((prev) => ({
      ...prev,
      store_addresses: [
        ...(prev.store_addresses || []),
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
    if (editData.store_addresses && editData.store_addresses.length > 1) {
      setEditData((prev) => ({
        ...prev,
        store_addresses: prev.store_addresses?.filter((_, i) => i !== index),
      }));
    }
  };

  const addSocialLink = () => {
    setEditData((prev) => ({
      ...prev,
      social_links: [...(prev.social_links || []), ""],
    }));
  };

  const removeSocialLink = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      social_links: prev.social_links?.filter((_, i) => i !== index),
    }));
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setError("");
    try {
      const response = await axios.put(`${apiUrl}/brands/profile`, editData);
      setProfileData(response.data.brand);
      setIsEditing(false);
      setEditData({});
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      setError(
        axiosError.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const validateImageUrl = async (url: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const img = document.createElement("img");
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const handleLogoUrlChange = async (url: string) => {
    setLogoUrl(url);
    if (url.trim()) {
      setIsValidatingLogo(true);
      const isValid = await validateImageUrl(url);
      setIsValidatingLogo(false);
      if (!isValid) {
        setError("Invalid image URL. Please provide a valid image URL.");
        return;
      }
    }
  };

  const saveLogo = async () => {
    if (!logoUrl.trim()) {
      setError("Please enter a logo URL");
      return;
    }

    setIsValidatingLogo(true);
    const isValid = await validateImageUrl(logoUrl);
    setIsValidatingLogo(false);

    if (!isValid) {
      setError("Invalid image URL. Please provide a valid image URL.");
      return;
    }

    try {
      const response = await axios.put(`${apiUrl}/brands/profile`, {
        logo_url: logoUrl.trim(),
      });
      setProfileData(response.data.brand);
      setShowLogoUpload(false);
      setLogoUrl("");
      setSuccess("Logo updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      setError(axiosError.response?.data?.message || "Failed to update logo");
    }
  };

  const openLogoUpload = () => {
    setLogoUrl(dataToDisplay.logo_url || "");
    setShowLogoUpload(true);
    setError("");
  };

  const cancelLogoUpload = () => {
    setShowLogoUpload(false);
    setLogoUrl("");
    setError("");
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-white/70">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white/70">Failed to load profile data</p>
        </div>
      </div>
    );
  }

  const dataToDisplay = isEditing ? editData : profileData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Brand Profile
            </h1>
            <p className="text-slate-300">
              Manage your brand information and settings
            </p>
          </div>
          {!isEditing ? (
            <button
              onClick={startEditing}
              className="flex items-center px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white transition-colors"
            >
              <Edit className="w-5 h-5 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={cancelEditing}
                className="flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
              >
                <X className="w-5 h-5 mr-2" />
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={isSaving}
                className="flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Basic Information */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img
                    src={dataToDisplay.logo_url}
                    alt={dataToDisplay.name}
                    className="w-24 h-24 rounded-2xl mx-auto mb-4 object-cover border-2 border-white/20"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%23374151' rx='16'/%3E%3Cpath d='M48 32c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm0 24c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z' fill='%236b7280'/%3E%3C/svg%3E";
                    }}
                  />
                  {!isEditing && (
                    <button
                      onClick={openLogoUpload}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
                      title="Change Logo"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <input
                    type="url"
                    value={dataToDisplay.logo_url || ""}
                    onChange={(e) =>
                      handleInputChange("logo_url", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Logo URL"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-white">
                    {dataToDisplay.name}
                  </h2>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Brand Name *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={dataToDisplay.name || ""}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Brand name"
                    />
                  ) : (
                    <p className="text-white">{dataToDisplay.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={dataToDisplay.description || ""}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Brand description"
                    />
                  ) : (
                    <p className="text-white/80">
                      {dataToDisplay.description || "No description provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Website
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={dataToDisplay.website || ""}
                      onChange={(e) =>
                        handleInputChange("website", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Website URL"
                    />
                  ) : (
                    <p className="text-white/80">
                      {dataToDisplay.website ? (
                        <a
                          href={dataToDisplay.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          {dataToDisplay.website}
                        </a>
                      ) : (
                        "No website provided"
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={dataToDisplay.email || ""}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Email address"
                    />
                  ) : (
                    <p className="text-white/80">{dataToDisplay.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Domain *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={dataToDisplay.domain || ""}
                      onChange={(e) =>
                        handleInputChange("domain", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Domain"
                    />
                  ) : (
                    <p className="text-white/80">{dataToDisplay.domain}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      value={dataToDisplay.gender || ""}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  ) : (
                    <p className="text-white/80">{dataToDisplay.gender}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Social Links
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {dataToDisplay.social_links?.map((link, index) => (
                        <div key={index} className="flex space-x-2">
                          <input
                            type="url"
                            value={link}
                            onChange={(e) => {
                              const newLinks = [
                                ...(dataToDisplay.social_links || []),
                              ];
                              newLinks[index] = e.target.value;
                              handleInputChange("social_links", newLinks);
                            }}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Social media URL"
                          />
                          <button
                            type="button"
                            onClick={() => removeSocialLink(index)}
                            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addSocialLink}
                        className="w-full py-2 border-2 border-dashed border-white/30 rounded-lg text-white/70 hover:text-white hover:border-white/50 transition-colors text-sm"
                      >
                        + Add Social Link
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {(dataToDisplay.social_links?.length || 0) > 0 ? (
                        dataToDisplay.social_links?.map((link, index) => (
                          <p key={index} className="text-white/80">
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:text-indigo-300"
                            >
                              {link}
                            </a>
                          </p>
                        ))
                      ) : (
                        <p className="text-white/50">
                          No social links provided
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        dataToDisplay.is_active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {dataToDisplay.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-white/70">Onboarded:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        dataToDisplay.is_onboarded
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {dataToDisplay.is_onboarded ? "Complete" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store Addresses */}
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center mb-4">
                <Building className="w-5 h-5 text-indigo-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">
                  Store Addresses
                </h3>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {dataToDisplay.store_addresses?.map((address, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-2xl p-4 border border-white/10"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-white font-medium">
                          {index === 0 ? "Primary Store" : `Store ${index + 1}`}
                        </h4>
                        {dataToDisplay.store_addresses &&
                          (dataToDisplay.store_addresses.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => removeStoreAddress(index)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
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
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            placeholder="Street Address *"
                          />
                        </div>
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
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="City *"
                        />
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
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="State *"
                        />
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
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="Country *"
                        />
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
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="Pincode *"
                        />
                        <input
                          type="text"
                          value={address.landmark || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "store_addresses",
                              { landmark: e.target.value },
                              index
                            )
                          }
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="Landmark"
                        />
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
              ) : (
                <div className="space-y-4">
                  {(dataToDisplay.store_addresses?.length || 0) > 0 ? (
                    dataToDisplay.store_addresses?.map((address, index) => (
                      <div
                        key={index}
                        className="bg-white/5 rounded-2xl p-4 border border-white/10"
                      >
                        <h4 className="text-white font-medium mb-2">
                          {index === 0 ? "Primary Store" : `Store ${index + 1}`}
                        </h4>
                        <div className="text-white/80 space-y-1">
                          <p>{address.street}</p>
                          <p>
                            {address.city}, {address.state} {address.pincode}
                          </p>
                          <p>{address.country}</p>
                          {address.landmark && (
                            <p className="text-white/60">
                              Near: {address.landmark}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/50">No store addresses provided</p>
                  )}
                </div>
              )}
            </div>

            {/* Emergency Contact */}
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center mb-4">
                <Phone className="w-5 h-5 text-indigo-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">
                  Emergency Contact
                </h3>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={dataToDisplay.emergency_contact?.name || ""}
                      onChange={(e) =>
                        handleInputChange("emergency_contact", {
                          ...dataToDisplay.emergency_contact,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={dataToDisplay.emergency_contact?.email || ""}
                      onChange={(e) =>
                        handleInputChange("emergency_contact", {
                          ...dataToDisplay.emergency_contact,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={dataToDisplay.emergency_contact?.number || ""}
                      onChange={(e) =>
                        handleInputChange("emergency_contact", {
                          ...dataToDisplay.emergency_contact,
                          number: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Working Hours *
                    </label>
                    <input
                      type="text"
                      value={
                        dataToDisplay.emergency_contact?.working_hours || ""
                      }
                      onChange={(e) =>
                        handleInputChange("emergency_contact", {
                          ...dataToDisplay.emergency_contact,
                          working_hours: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., 9 AM - 6 PM"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/70 text-sm">Name</p>
                    <p className="text-white">
                      {dataToDisplay.emergency_contact?.name || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Email</p>
                    <p className="text-white">
                      {dataToDisplay.emergency_contact?.email || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Phone</p>
                    <p className="text-white">
                      {dataToDisplay.emergency_contact?.number ||
                        "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Working Hours</p>
                    <p className="text-white">
                      {dataToDisplay.emergency_contact?.working_hours ||
                        "Not provided"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bank Details */}
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 text-indigo-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">
                  Bank Details
                </h3>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      value={dataToDisplay.bank_details?.account_number || ""}
                      onChange={(e) =>
                        handleInputChange("bank_details", {
                          ...dataToDisplay.bank_details,
                          account_number: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      IFSC Code *
                    </label>
                    <input
                      type="text"
                      value={dataToDisplay.bank_details?.ifsc_code || ""}
                      onChange={(e) =>
                        handleInputChange("bank_details", {
                          ...dataToDisplay.bank_details,
                          ifsc_code: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="IFSC code"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      UPI ID *
                    </label>
                    <input
                      type="text"
                      value={dataToDisplay.bank_details?.upi_id || ""}
                      onChange={(e) =>
                        handleInputChange("bank_details", {
                          ...dataToDisplay.bank_details,
                          upi_id: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="UPI ID"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/70 text-sm">Account Number</p>
                    <p className="text-white">
                      {dataToDisplay.bank_details?.account_number ||
                        "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">IFSC Code</p>
                    <p className="text-white">
                      {dataToDisplay.bank_details?.ifsc_code || "Not provided"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-white/70 text-sm">UPI ID</p>
                    <p className="text-white">
                      {dataToDisplay.bank_details?.upi_id || "Not provided"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Policies */}
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center mb-4">
                <FileText className="w-5 h-5 text-indigo-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">
                  Store Policies
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Return Policy
                  </label>
                  {isEditing ? (
                    <textarea
                      value={dataToDisplay.return_policy || ""}
                      onChange={(e) =>
                        handleInputChange("return_policy", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Return policy"
                    />
                  ) : (
                    <p className="text-white/80">
                      {dataToDisplay.return_policy ||
                        "No return policy provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Shipping Policy
                  </label>
                  {isEditing ? (
                    <textarea
                      value={dataToDisplay.shipping_policy || ""}
                      onChange={(e) =>
                        handleInputChange("shipping_policy", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Shipping policy"
                    />
                  ) : (
                    <p className="text-white/80">
                      {dataToDisplay.shipping_policy ||
                        "No shipping policy provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Store Policy
                  </label>
                  {isEditing ? (
                    <textarea
                      value={dataToDisplay.store_policy || ""}
                      onChange={(e) =>
                        handleInputChange("store_policy", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Store policy"
                    />
                  ) : (
                    <p className="text-white/80">
                      {dataToDisplay.store_policy || "No store policy provided"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-indigo-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">
                  Account Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-white/70 text-sm">Created</p>
                  <p className="text-white">
                    {formatDate(dataToDisplay.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Last Updated</p>
                  <p className="text-white">
                    {dataToDisplay.updated_at
                      ? formatDate(dataToDisplay.updated_at)
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Upload Modal */}
      {showLogoUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Image className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Update Logo</h3>
              </div>
              <button
                onClick={cancelLogoUpload}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Current Logo Preview */}
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={logoUrl || dataToDisplay.logo_url}
                    alt="Logo Preview"
                    className="w-20 h-20 rounded-2xl mx-auto object-cover border-2 border-white/20"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23374151' rx='12'/%3E%3Cpath d='M40 28c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zm0 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z' fill='%236b7280'/%3E%3C/svg%3E";
                    }}
                  />
                  {isValidatingLogo && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-white/70 text-sm mt-2">Logo Preview</p>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Logo URL *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => handleLogoUrlChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    placeholder="https://example.com/logo.png"
                  />
                  <ExternalLink className="absolute right-3 top-3.5 w-5 h-5 text-white/50" />
                </div>
                <p className="text-white/60 text-xs mt-2">
                  Enter a direct URL to an image file (PNG, JPG, GIF, SVG)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={cancelLogoUpload}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveLogo}
                  disabled={!logoUrl.trim() || isValidatingLogo}
                  className="flex-1 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors flex items-center justify-center"
                >
                  {isValidatingLogo ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Logo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandProfile;
