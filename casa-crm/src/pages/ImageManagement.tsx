import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Image,
  Save,
  Upload,
  Package,
} from "lucide-react";
import axios from "axios";
import { useNotifications } from "../contexts/NotificationContext";
import testImageAPI from "../utils/testImageAPI";

interface StaticImage {
  _id: string;
  name: string;
  description: string;
  url: string;
  tag: string;
  altText: string;
  category: string;
  device: "desktop" | "mobile" | "tablet" | "all";
  position: string;
  displayPeriod: {
    startDate: string | null;
    endDate: string | null;
  };
  priority: number;
  metadata: {
    eventName?: string;
    campaignId?: string;
    targetAudience?: "all" | "men" | "women" | "kids" | "premium";
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ImageCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const ImageManagement = () => {
  const { addNotification } = useNotifications();
  const [staticImages, setStaticImages] = useState<StaticImage[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingImage, setEditingImage] = useState<StaticImage | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [imageSearchTerm, setImageSearchTerm] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);

  const imageCategories: ImageCategory[] = [
    {
      id: "all",
      name: "All Images",
      description: "View all static images",
      icon: "Image",
    },
    {
      id: "hero",
      name: "Hero Section",
      description: "Main banner and hero images",
      icon: "Monitor",
    },
    {
      id: "trends",
      name: "Trends Page",
      description: "Trends and fashion images",
      icon: "TrendingUp",
    },
    {
      id: "products",
      name: "Product Gallery",
      description: "Product showcase images",
      icon: "Package",
    },
    {
      id: "brands",
      name: "Brand Assets",
      description: "Brand logos and assets",
      icon: "Building2",
    },
    {
      id: "ui",
      name: "UI Elements",
      description: "Interface and UI images",
      icon: "Smartphone",
    },
    {
      id: "seasonal",
      name: "Seasonal",
      description: "Seasonal and holiday images",
      icon: "Calendar",
    },
    {
      id: "campaign",
      name: "Campaign",
      description: "Marketing campaign images",
      icon: "Megaphone",
    },
    {
      id: "promotion",
      name: "Promotion",
      description: "Promotional and sale images",
      icon: "Tag",
    },
  ];

  const fetchStaticImages = useCallback(async () => {
    try {
      setImageLoading(true);
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const response = await axios.get(`${apiUrl}/admin/static-images`);
      setStaticImages(response.data.images || []);
    } catch (error) {
      console.error("Error fetching static images:", error);
      addNotification({
        type: "error",
        title: "Failed to Load Images",
        message: "Could not load static images. Please try again.",
        duration: 5000,
      });
    } finally {
      setImageLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchStaticImages();
  }, [fetchStaticImages]);

  const handleImageSubmit = async (imageData: Partial<StaticImage>) => {
    try {
      setImageLoading(true);

      if (editingImage) {
        // Update existing image
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:5002/api";
        await axios.put(
          `${apiUrl}/admin/static-images/${editingImage._id}`,
          imageData
        );
        addNotification({
          type: "success",
          title: "Image Updated",
          message: "Static image has been updated successfully.",
          duration: 5000,
        });
      } else {
        // Create new image
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:5002/api";
        await axios.post(`${apiUrl}/admin/static-images`, imageData);
        addNotification({
          type: "success",
          title: "Image Added",
          message: "New static image has been added successfully.",
          duration: 5000,
        });
      }

      await fetchStaticImages();
      setShowImageModal(false);
      setEditingImage(null);
    } catch (error) {
      console.error("Error saving image:", error);
      addNotification({
        type: "error",
        title: "Failed to Save Image",
        message: "Could not save image. Please try again.",
        duration: 5000,
      });
    } finally {
      setImageLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this image? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setImageLoading(true);
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      await axios.delete(`${apiUrl}/admin/static-images/${imageId}`);

      addNotification({
        type: "success",
        title: "Image Deleted",
        message: "Static image has been deleted successfully.",
        duration: 5000,
      });

      await fetchStaticImages();
    } catch (error) {
      console.error("Error deleting image:", error);
      addNotification({
        type: "error",
        title: "Failed to Delete Image",
        message: "Could not delete image. Please try again.",
        duration: 5000,
      });
    } finally {
      setImageLoading(false);
    }
  };

  const openImageModal = (image?: StaticImage) => {
    setEditingImage(image || null);
    setShowImageModal(true);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const success = await testImageAPI();
      if (success) {
        addNotification({
          type: "success",
          title: "Connection Test Passed",
          message: "Frontend-Backend connection is working perfectly!",
          duration: 5000,
        });
        // Refresh the images list
        await fetchStaticImages();
      } else {
        addNotification({
          type: "error",
          title: "Connection Test Failed",
          message: "Please check if the backend server is running.",
          duration: 5000,
        });
      }
    } catch (err) {
      console.error("Connection test error:", err);
      addNotification({
        type: "error",
        title: "Connection Test Error",
        message: "Failed to test connection. Please check console for details.",
        duration: 5000,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleGenerateStaticJson = async () => {
    setTestingConnection(true);
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const response = await axios.post(
        `${apiUrl}/admin/static-images/generate-json`
      );

      if (response.data.success) {
        addNotification({
          type: "success",
          title: "Static JSON Generated",
          message: `Successfully generated staticImages.json with ${response.data.data.totalImages} images. Frontend will now load images faster!`,
          duration: 7000,
        });
        // Refresh the images list
        await fetchStaticImages();
      } else {
        addNotification({
          type: "error",
          title: "Generation Failed",
          message: "Failed to generate static JSON file.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error generating static JSON:", error);
      addNotification({
        type: "error",
        title: "Generation Error",
        message:
          "Failed to generate static JSON. Please check console for details.",
        duration: 5000,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const filteredImages = staticImages.filter((image) => {
    const matchesCategory =
      selectedCategory === "all" || image.category === selectedCategory;
    const matchesSearch =
      image.name.toLowerCase().includes(imageSearchTerm.toLowerCase()) ||
      image.description.toLowerCase().includes(imageSearchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="glass rounded-3xl mx-6 mt-6 shadow-2xl border border-white/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl mb-4 shadow-2xl shadow-indigo-500/25">
                <Image className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-100 bg-clip-text text-transparent">
                Image Management
              </h1>
              <p className="text-white/70 text-lg mt-2">
                Manage static images for the frontend
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGenerateStaticJson}
                disabled={testingConnection}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2 hover:scale-105"
              >
                {testingConnection ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Generate Static JSON</span>
                  </>
                )}
              </button>
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-blue-500/25 flex items-center space-x-2 hover:scale-105"
              >
                {testingConnection ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
              <button
                onClick={() => openImageModal()}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 flex items-center space-x-2 hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Add Image</span>
              </button>
              <div className="glass rounded-2xl px-6 py-4 border border-white/20">
                <div className="text-sm text-white/70">
                  Total Images:{" "}
                  <span className="font-semibold text-white text-lg">
                    {staticImages.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="glass rounded-3xl shadow-2xl border border-white/20 backdrop-blur-xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-indigo-400 w-6 h-6" />
                  <input
                    type="text"
                    placeholder="Search images by name or description..."
                    value={imageSearchTerm}
                    onChange={(e) => setImageSearchTerm(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 glass border-0 rounded-3xl shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50 input-focus"
                  />
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-80">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-6 py-5 glass border-0 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white bg-transparent"
              >
                {imageCategories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    className="bg-slate-800 text-white"
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Images Grid */}
        <div className="glass rounded-3xl shadow-2xl border border-white/20 backdrop-blur-xl overflow-hidden">
          {imageLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              <span className="ml-4 text-white/70 text-lg">
                Loading images...
              </span>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 glass rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Image className="w-12 h-12 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No images found
              </h3>
              <p className="text-white/70 text-lg">
                {imageSearchTerm || selectedCategory !== "all"
                  ? "Try adjusting your search criteria."
                  : "No static images have been added yet."}
              </p>
            </div>
          ) : (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredImages.map((image, index) => (
                  <div
                    key={image._id}
                    className="glass rounded-2xl p-6 shadow-2xl border border-white/10 hover:scale-105 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Image Preview */}
                    <div className="relative mb-4">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-48 object-cover rounded-xl"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=";
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            image.isActive
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {image.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Image Info */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1 truncate">
                          {image.name}
                        </h3>
                        <p className="text-white/70 text-sm line-clamp-2">
                          {image.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
                          {image.category}
                        </span>
                        <span className="text-white/60">{image.device}</span>
                      </div>

                      <div className="text-xs text-white/50 space-y-1">
                        <div>
                          Tag:{" "}
                          <span className="text-blue-300 font-medium">
                            {image.tag}
                          </span>
                        </div>
                        {image.position && (
                          <div>Position: {image.position}</div>
                        )}
                        {image.priority > 0 && (
                          <div>Priority: {image.priority}</div>
                        )}
                        {image.metadata?.eventName && (
                          <div>Event: {image.metadata.eventName}</div>
                        )}
                        {image.metadata?.campaignId && (
                          <div>Campaign: {image.metadata.campaignId}</div>
                        )}
                        {image.displayPeriod?.startDate && (
                          <div className="text-green-300">
                            Active:{" "}
                            {new Date(
                              image.displayPeriod.startDate
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(
                              image.displayPeriod.endDate || ""
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => openImageModal(image)}
                          className="flex-1 px-3 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-all duration-300 flex items-center justify-center space-x-1"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteImage(image._id)}
                          className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Management Modal */}
      {showImageModal && (
        <ImageManagementModal
          image={editingImage}
          onClose={() => {
            setShowImageModal(false);
            setEditingImage(null);
          }}
          onSubmit={handleImageSubmit}
          loading={imageLoading}
        />
      )}
    </div>
  );
};

// Image Management Modal Component
interface ImageModalProps {
  image?: StaticImage | null;
  onClose: () => void;
  onSubmit: (imageData: Partial<StaticImage>) => void;
  loading: boolean;
}

const ImageManagementModal: React.FC<ImageModalProps> = ({
  image,
  onClose,
  onSubmit,
  loading,
}) => {
  const [formData, setFormData] = useState({
    name: image?.name || "",
    description: image?.description || "",
    url: image?.url || "",
    tag: image?.tag || "",
    altText: image?.altText || "",
    category: image?.category || "hero",
    device: image?.device || "all",
    position: image?.position || "",
    priority: image?.priority || 0,
    displayPeriod: {
      startDate: image?.displayPeriod?.startDate || "",
      endDate: image?.displayPeriod?.endDate || "",
    },
    metadata: {
      eventName: image?.metadata?.eventName || "",
      campaignId: image?.metadata?.campaignId || "",
      targetAudience: image?.metadata?.targetAudience || "all",
    },
    isActive: image?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 w-full max-w-2xl glass rounded-3xl shadow-2xl border border-white/20 backdrop-blur-xl">
        <div className="mt-3">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl">
            <Image className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-2xl font-bold text-white">
              {image ? "Edit Image" : "Add New Image"}
            </h3>
            <p className="text-sm text-white/70 mt-2">
              {image
                ? "Update static image details"
                : "Add a new static image for the frontend"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Image Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter image name"
                  className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50"
                  required
                />
              </div>

              {/* Tag */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Tag *
                </label>
                <input
                  type="text"
                  name="tag"
                  value={formData.tag}
                  onChange={handleChange}
                  placeholder="e.g., hero-banner, seasonal-sale"
                  className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white bg-transparent"
                  required
                >
                  <option value="hero" className="bg-slate-800 text-white">
                    Hero Section
                  </option>
                  <option value="trends" className="bg-slate-800 text-white">
                    Trends Page
                  </option>
                  <option value="products" className="bg-slate-800 text-white">
                    Product Gallery
                  </option>
                  <option value="brands" className="bg-slate-800 text-white">
                    Brand Assets
                  </option>
                  <option value="ui" className="bg-slate-800 text-white">
                    UI Elements
                  </option>
                  <option value="seasonal" className="bg-slate-800 text-white">
                    Seasonal
                  </option>
                  <option value="campaign" className="bg-slate-800 text-white">
                    Campaign
                  </option>
                  <option value="promotion" className="bg-slate-800 text-white">
                    Promotion
                  </option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Priority (0-100)
                </label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  placeholder="0"
                  className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this image..."
                rows={3}
                className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50 resize-none"
              />
            </div>

            {/* Alt Text */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90">
                Alt Text
              </label>
              <input
                type="text"
                name="altText"
                value={formData.altText}
                onChange={handleChange}
                placeholder="Alternative text for accessibility"
                className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50"
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90">
                Image URL *
              </label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Device Type */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Device Type
                </label>
                <select
                  name="device"
                  value={formData.device}
                  onChange={handleChange}
                  className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white bg-transparent"
                >
                  <option value="all" className="bg-slate-800 text-white">
                    All Devices
                  </option>
                  <option value="desktop" className="bg-slate-800 text-white">
                    Desktop
                  </option>
                  <option value="mobile" className="bg-slate-800 text-white">
                    Mobile
                  </option>
                  <option value="tablet" className="bg-slate-800 text-white">
                    Tablet
                  </option>
                </select>
              </div>

              {/* Position */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="e.g., hero-banner, sidebar, footer"
                  className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50"
                />
              </div>
            </div>

            {/* Display Period */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white/90">
                Display Period (Optional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white/90">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    name="displayPeriod.startDate"
                    value={formData.displayPeriod.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        displayPeriod: {
                          ...prev.displayPeriod,
                          startDate: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white/90">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    name="displayPeriod.endDate"
                    value={formData.displayPeriod.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        displayPeriod: {
                          ...prev.displayPeriod,
                          endDate: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white/90">
                Campaign Metadata (Optional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white/90">
                    Event Name
                  </label>
                  <input
                    type="text"
                    name="metadata.eventName"
                    value={formData.metadata.eventName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          eventName: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g., Black Friday Sale"
                    className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white/90">
                    Campaign ID
                  </label>
                  <input
                    type="text"
                    name="metadata.campaignId"
                    value={formData.metadata.campaignId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          campaignId: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g., BF2024"
                    className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Target Audience
                </label>
                <select
                  name="metadata.targetAudience"
                  value={formData.metadata.targetAudience}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        targetAudience: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white bg-transparent"
                >
                  <option value="all" className="bg-slate-800 text-white">
                    All
                  </option>
                  <option value="men" className="bg-slate-800 text-white">
                    Men
                  </option>
                  <option value="women" className="bg-slate-800 text-white">
                    Women
                  </option>
                  <option value="kids" className="bg-slate-800 text-white">
                    Kids
                  </option>
                  <option value="premium" className="bg-slate-800 text-white">
                    Premium
                  </option>
                </select>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 text-indigo-500 bg-transparent border-2 border-indigo-500 rounded focus:ring-indigo-500 focus:ring-2"
              />
              <label className="text-sm font-semibold text-white/90">
                Active (visible on frontend)
              </label>
            </div>

            {/* Image Preview */}
            {formData.url && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Preview
                </label>
                <div className="relative">
                  <img
                    src={formData.url}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=";
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{image ? "Update Image" : "Add Image"}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 glass text-white rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ImageManagement;
