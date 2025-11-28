import React, { useState, useEffect } from "react";
import {
  MoreVertical,
  Trash2,
  Power,
  PowerOff,
  Package,
  Building2,
  Mail,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Filter,
  CalendarDays,
  MapPin,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import axios from "axios";
import { useNotifications } from "../contexts/NotificationContext";

interface Brand {
  _id: string;
  name: string;
  email: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  productCount: number;
  description?: string;
  social_links?: string[];
  // New fields from extended API
  brandId?: string;
  brandName?: string;
  contactPerson?: string;
  contactEmail?: string;
  status?: string;
  joinedDate?: string;
  totalOrders?: number;
  location?: string;
  policies?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalBrands: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const AdminDashboard = () => {
  const { addNotification } = useNotifications();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalBrands: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  // Removed generic search; keep only explicit filters
  // New filter states
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [brandIdFilter, setBrandIdFilter] = useState("");
  // Compact filters: single onboarding date (not range), no location filter
  const [onboardingDate, setOnboardingDate] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [newBrandEmail, setNewBrandEmail] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [addBrandLoading, setAddBrandLoading] = useState(false);

  // Filter states
  const [sortBy, setSortBy] = useState<"product_count" | "joining_date">(
    "joining_date"
  );
  const [sortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const activeFilterCount =
    [nameFilter, emailFilter, brandIdFilter, onboardingDate].filter(Boolean).length +
    (statusFilter !== "all" ? 1 : 0);

  const fetchBrands = async (page = 1) => {
    try {
      setLoading(true);
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";

      const params = {
        page,
        limit: 10,
        sortBy,
        order: sortOrder,
        status: statusFilter,
        // New filters
        name: nameFilter || undefined,
        email: emailFilter || undefined,
        brandId: brandIdFilter || undefined,
        // For single-date filter, pass it as both start and end to match one day
        onboardingDateStart: onboardingDate || undefined,
        onboardingDateEnd: onboardingDate || undefined,
      };

      console.log("🚀 Frontend sending params:", params);

      const response = await axios.get(`${apiUrl}/brands/admin/brands`, {
        params,
      });

      console.log("📥 Frontend received response:", {
        brandsCount: response.data.brands.length,
        pagination: response.data.pagination,
      });

      setBrands(response.data.brands);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [sortBy, sortOrder, statusFilter]);

  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchBrands(1);
  };

  const resetFilters = () => {
    setNameFilter("");
    setEmailFilter("");
    setBrandIdFilter("");
    setOnboardingDate("");
    setStatusFilter("all");
    // preserve sort selections
    fetchBrands(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchBrands(newPage);
  };

  const handleBrandAction = async (
    brandId: string,
    action: "activate" | "deactivate" | "delete"
  ) => {
    try {
      setActionLoading(brandId);

      if (action === "delete") {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:5002/api";
        await axios.delete(`${apiUrl}/brands/admin/brands/${brandId}`);
      } else {
        const endpoint = action === "activate" ? "activate" : "deactivate";
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:5002/api";
        await axios.put(`${apiUrl}/brands/admin/brands/${brandId}/${endpoint}`);
      }

      // Refresh the brands list
  await fetchBrands(pagination.currentPage);
      setShowModal(false);
      setSelectedBrand(null);
    } catch (error) {
      console.error(`Error ${action}ing brand:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    return password;
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandEmail || !generatedPassword) return;

    try {
      setAddBrandLoading(true);

      // Generate a random brand name from email
      const brandName = newBrandEmail
        .split("@")[0]
        .replace(/[^a-zA-Z0-9]/g, "");

      const brandData = {
        name: brandName.charAt(0).toUpperCase() + brandName.slice(1),
        email: newBrandEmail,
        password: generatedPassword,
        domain: `${brandName.toLowerCase()}-${Date.now()}`,
        is_active: true,
      };

      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      await axios.post(`${apiUrl}/brands/create`, brandData);

      // Refresh the brands list
  await fetchBrands(pagination.currentPage);

      // Show success notification
      addNotification({
        type: "success",
        title: "Brand Created Successfully",
        message: `Brand account created for ${newBrandEmail} with auto-generated password`,
        duration: 5000,
      });

      // Reset form
      setNewBrandEmail("");
      setGeneratedPassword("");
      setShowAddBrandModal(false);
    } catch (error) {
      console.error("Error adding brand:", error);
      addNotification({
        type: "error",
        title: "Failed to Create Brand",
        message: "There was an error creating the brand. Please try again.",
        duration: 5000,
      });
    } finally {
      setAddBrandLoading(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy password:", error);
    }
  };

  const openAddBrandModal = () => {
    setNewBrandEmail("");
    setGeneratedPassword("");
    setShowPassword(false);
    setPasswordCopied(false);
    setShowAddBrandModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span
        className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold ${
          isActive
            ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30"
            : "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-500/30"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="glass rounded-3xl mx-6 mt-6 shadow-2xl border border-white/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl mb-4 shadow-2xl shadow-indigo-500/25">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-100 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-white/70 text-lg mt-2">
                Manage all registered brands
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={openAddBrandModal}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 flex items-center space-x-2 hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Add Brand</span>
              </button>
              <div className="glass rounded-2xl px-6 py-4 border border-white/20">
                <div className="text-sm text-white/70">
                  Total Brands: <span className="font-semibold text-white text-lg">{pagination.totalBrands}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="glass rounded-3xl shadow-2xl border border-white/20 backdrop-blur-xl p-4 md:p-5 mb-6">
          <form onSubmit={applyFilters} className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                  <Filter className="w-4 h-4 text-indigo-300" />
                </div>
                <span className="font-medium">Brand Filters</span>
                <span className="text-white/60 text-xs">• {activeFilterCount} active</span>
              </div>
            </div>

            {/* Top compact controls: Sort / Order / Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-white/60 text-xs mb-1">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "product_count" | "joining_date")}
                  className="w-full px-3 py-2.5 glass border-0 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white/10 text-sm"
                >
                  <option value="joining_date" className="bg-slate-800">Joining Date</option>
                  <option value="product_count" className="bg-slate-800">Product Count</option>
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                  className="w-full px-3 py-2.5 glass border-0 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white/10 text-sm"
                >
                  <option value="all" className="bg-slate-800">All Brands</option>
                  <option value="active" className="bg-slate-800">Active Only</option>
                  <option value="inactive" className="bg-slate-800">Inactive Only</option>
                </select>
              </div>
               <div>
                <label className="block text-white/60 text-xs mb-1">Onboarding Date</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                  <input
                    type="date"
                    value={onboardingDate}
                    onChange={(e) => setOnboardingDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 glass border-0 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Inputs row: single responsive row/grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-white/60 text-xs mb-1">Brand Name</label>
                <input
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="w-full px-3 py-2.5 glass border-0 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm"
                  placeholder="e.g. Nike"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                  <input
                    type="text"
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 glass border-0 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm"
                    placeholder="contact@brand.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1">Brand ID</label>
                <input
                  type="text"
                  value={brandIdFilter}
                  onChange={(e) => setBrandIdFilter(e.target.value)}
                  className="w-full px-3 py-2.5 glass border-0 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm"
                  placeholder="ObjectId or partial"
                />
              </div>
             
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 glass text-white rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center gap-2 border border-white/10 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-indigo-500/25 flex items-center gap-2 text-sm"
              >
                <Filter className="w-4 h-4" />
                <span>Apply</span>
              </button>
            </div>
          </form>
        </div>

        {/* Brands Table */}
        <div className="glass rounded-3xl shadow-2xl border border-white/20 backdrop-blur-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              <span className="ml-4 text-white/70 text-lg">
                Loading brands...
              </span>
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 glass rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Building2 className="w-12 h-12 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No brands found
              </h3>
              <p className="text-white/70 text-lg">No brands have been registered yet.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 hidden md:table">
                  <thead className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                    <tr>
                      <th className="px-8 py-6 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Email</th>
                      <th className="px-8 py-6 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <span>Joined</span>
                          {sortBy === "joining_date" && (
                            <span className="text-indigo-400 text-xs">
                              ({sortOrder === "asc" ? "↑" : "↓"})
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Total Orders</th>
                      <th className="px-8 py-6 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Total Products</th>
                      <th className="px-8 py-6 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Contact Email</th>
                      <th className="px-8 py-6 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Policies</th>
                      <th className="px-8 py-6 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Location</th>
                      <th className="px-8 py-6 text-right text-sm font-semibold text-white/90 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {brands.map((brand) => (
                      <tr
                        key={brand._id}
                        className="hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {brand.logo_url ? (
                                <img
                                  className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/20"
                                  src={brand.logo_url}
                                  alt={brand.name}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-indigo-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-6">
                              <div className="text-lg font-semibold text-white">
                                {brand.name}
                              </div>
                              <div className="text-xs text-white/50">ID: {brand._id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-white/80">{brand.contactPerson || "-"}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-white">{brand.email}</td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          {getStatusBadge(brand.is_active)}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm text-white/70">
                          {formatDate(brand.joinedDate || brand.created_at)}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-white">{brand.totalOrders ?? 0}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-white">
                          <div className="flex items-center text-sm">
                            <Package className="h-4 w-4 text-indigo-400 mr-2" />
                            <span className="text-lg font-semibold">{brand.productCount}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-white/80">{brand.contactEmail || "-"}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm text-white/70 max-w-xs truncate">{brand.policies || "-"}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-white/80">{brand.location || "-"}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedBrand(brand);
                                setShowModal(true);
                              }}
                              className="w-10 h-10 glass rounded-2xl flex items-center justify-center hover:bg-indigo-500/20 transition-all duration-300 hover:scale-110"
                            >
                              <MoreVertical className="h-5 w-5 text-white/70 hover:text-white" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                  {brands.map((brand) => (
                    <div key={brand._id} className="glass rounded-2xl border border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {brand.logo_url ? (
                            <img src={brand.logo_url} className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/20" />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-indigo-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-white font-semibold">{brand.name}</div>
                            <div className="text-xs text-white/50">ID: {brand._id}</div>
                          </div>
                        </div>
                        {getStatusBadge(brand.is_active)}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div className="text-white/80 col-span-2 flex items-center"><Mail className="w-4 h-4 text-indigo-400 mr-2" /> {brand.email}</div>
                        <div className="text-white/80">Total Orders: <span className="text-white font-semibold">{brand.totalOrders ?? 0}</span></div>
                        <div className="text-white/80">Total Products: <span className="text-white font-semibold">{brand.productCount}</span></div>
                        <div className="text-white/80 col-span-2">Contact Person: <span className="text-white">{brand.contactPerson || "-"}</span></div>
                        <div className="text-white/80 col-span-2">Contact Email: <span className="text-white">{brand.contactEmail || "-"}</span></div>
                        {brand.location && (
                          <div className="text-white/80 col-span-2 flex items-center"><MapPin className="w-4 h-4 text-indigo-400 mr-2" /> {brand.location}</div>
                        )}
                        <div className="text-white/70 col-span-2 flex items-center"><CalendarDays className="w-4 h-4 text-indigo-400 mr-2" /> Joined: {formatDate(brand.joinedDate || brand.created_at)}</div>
                        {brand.policies && (
                          <div className="text-white/70 col-span-2 flex items-start"><ShieldCheck className="w-4 h-4 text-indigo-400 mr-2 mt-0.5" /> <span className="truncate">{brand.policies}</span></div>
                        )}
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => { setSelectedBrand(brand); setShowModal(true); }}
                          className="px-3 py-2 glass rounded-xl text-white text-sm"
                        >
                          Actions
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="glass px-8 py-6 flex items-center justify-between border-t border-white/10">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-6 py-3 glass text-sm font-medium rounded-2xl text-white hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={!pagination.hasNext}
                      className="ml-3 relative inline-flex items-center px-6 py-3 glass text-sm font-medium rounded-2xl text-white hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-white/70">
                        Showing page{" "}
                        <span className="font-semibold text-white">
                          {pagination.currentPage}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-white">
                          {pagination.totalPages}
                        </span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-2xl shadow-sm -space-x-px">
                        <button
                          onClick={() =>
                            handlePageChange(pagination.currentPage - 1)
                          }
                          disabled={!pagination.hasPrev}
                          className="relative inline-flex items-center px-6 py-3 rounded-l-2xl glass text-sm font-medium text-white hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            handlePageChange(pagination.currentPage + 1)
                          }
                          disabled={!pagination.hasNext}
                          className="relative inline-flex items-center px-6 py-3 rounded-r-2xl glass text-sm font-medium text-white hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showModal && selectedBrand && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 w-96 glass rounded-3xl shadow-2xl border border-white/20 backdrop-blur-xl">
            <div className="mt-3">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl">
                <Building2 className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold text-white">Brand Actions</h3>
                <div className="mt-3 px-4 py-4">
                  <p className="text-sm text-white/70">
                    What would you like to do with{" "}
                    <strong className="text-white">{selectedBrand.name}</strong>
                    ?
                  </p>
                </div>
                <div className="flex flex-col space-y-3 mt-6">
                  {selectedBrand.is_active ? (
                    <button
                      onClick={() =>
                        handleBrandAction(selectedBrand._id, "deactivate")
                      }
                      disabled={actionLoading === selectedBrand._id}
                      className="w-full inline-flex justify-center items-center px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-semibold rounded-2xl hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-yellow-500/25"
                    >
                      {actionLoading === selectedBrand._id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      ) : (
                        <PowerOff className="h-5 w-5 mr-3" />
                      )}
                      Deactivate Brand
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleBrandAction(selectedBrand._id, "activate")
                      }
                      disabled={actionLoading === selectedBrand._id}
                      className="w-full inline-flex justify-center items-center px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-2xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                    >
                      {actionLoading === selectedBrand._id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      ) : (
                        <Power className="h-5 w-5 mr-3" />
                      )}
                      Activate Brand
                    </button>
                  )}
                  <button
                    onClick={() =>
                      handleBrandAction(selectedBrand._id, "delete")
                    }
                    disabled={actionLoading === selectedBrand._id}
                    className="w-full inline-flex justify-center items-center px-6 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold rounded-2xl hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-red-500/25"
                  >
                    {actionLoading === selectedBrand._id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    ) : (
                      <Trash2 className="h-5 w-5 mr-3" />
                    )}
                    Delete Brand
                  </button>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedBrand(null);
                    }}
                    className="w-full inline-flex justify-center px-6 py-4 glass text-white text-sm font-semibold rounded-2xl hover:bg-white/10 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Brand Modal */}
      {showAddBrandModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 w-96 glass rounded-3xl shadow-2xl border border-white/20 backdrop-blur-xl">
            <div className="mt-3">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl">
                <Plus className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold text-white">Add New Brand</h3>
                <p className="text-sm text-white/70 mt-2">
                  Create a new brand account with auto-generated credentials
                </p>
              </div>

              <form onSubmit={handleAddBrand} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    Gmail Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input
                      type="email"
                      value={newBrandEmail}
                      onChange={(e) => setNewBrandEmail(e.target.value)}
                      placeholder="brand@gmail.com"
                      className="w-full pl-12 pr-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    Generated Password
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={generatedPassword}
                        readOnly
                        className="w-full px-4 py-3 glass border-0 rounded-2xl text-white font-mono text-center"
                        placeholder="Click Generate to create password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors duration-300"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 flex items-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={copyPassword}
                      disabled={!generatedPassword}
                      className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {passwordCopied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {passwordCopied && (
                    <p className="text-sm text-green-400 mt-2 text-center">
                      Password copied to clipboard!
                    </p>
                  )}
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    disabled={
                      !newBrandEmail || !generatedPassword || addBrandLoading
                    }
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    {addBrandLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span>Create Brand</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddBrandModal(false)}
                    className="flex-1 px-6 py-3 glass text-white rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
