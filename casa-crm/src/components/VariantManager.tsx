import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Palette, Package, Image } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";

interface Variant {
  _id?: string;
  color: {
    name: string;
    hex: string;
  };
  sizes: string[];
  images: string[];
  stock: number;
  is_active: boolean;
}

interface VariantManagerProps {
  productId: string;
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
  isEditing?: boolean;
}

const VariantManager: React.FC<VariantManagerProps> = ({
  productId,
  variants,
  onVariantsChange,
  isEditing = false,
}) => {
  const { addNotification } = useNotifications();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [formData, setFormData] = useState({
    color: { name: "", hex: "#000000" },
    sizes: [""],
    images: [""],
    stock: 0,
    is_active: true,
  });

  const commonColors = [
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Red", hex: "#FF0000" },
    { name: "Blue", hex: "#0000FF" },
    { name: "Green", hex: "#00FF00" },
    { name: "Yellow", hex: "#FFFF00" },
    { name: "Orange", hex: "#FFA500" },
    { name: "Purple", hex: "#800080" },
    { name: "Pink", hex: "#FFC0CB" },
    { name: "Brown", hex: "#A52A2A" },
    { name: "Gray", hex: "#808080" },
    { name: "Navy", hex: "#000080" },
  ];

  const commonSizes = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

  useEffect(() => {
    if (isEditing && productId) {
      fetchVariants();
    }
  }, [productId, isEditing]);

  const fetchVariants = async () => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const response = await fetch(`${apiUrl}/products/${productId}/variants`);
      const data = await response.json();

      if (response.ok) {
        onVariantsChange(data.variants || []);
      }
    } catch (error) {
      console.error("Error fetching variants:", error);
    }
  };

  const handleAddVariant = async () => {
    if (!formData.color.name.trim()) {
      addNotification("Please enter a color name", "error");
      return;
    }

    // Check for duplicate variant (same color)
    const duplicate = variants.find(
      (v) => v.color.name === formData.color.name
    );
    if (duplicate) {
      addNotification("A variant with this color already exists", "error");
      return;
    }

    if (isEditing && productId) {
      // Add variant via API
      try {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:5002/api";
        const response = await fetch(
          `${apiUrl}/products/${productId}/variants`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("brandToken")}`,
            },
            body: JSON.stringify(formData),
          }
        );

        if (response.ok) {
          addNotification("Variant added successfully", "success");
          fetchVariants();
          resetForm();
        } else {
          const error = await response.json();
          addNotification(error.error || "Failed to add variant", "error");
        }
      } catch (error) {
        addNotification("Error adding variant", "error");
      }
    } else {
      // Add variant locally for new products
      const newVariant: Variant = {
        ...formData,
        sizes: formData.sizes.filter((size) => size.trim() !== ""),
        images: formData.images.filter((img) => img.trim() !== ""),
      };
      onVariantsChange([...variants, newVariant]);
      resetForm();
    }
  };

  const handleUpdateVariant = async () => {
    if (!editingVariant || !formData.color.name.trim()) {
      addNotification("Please enter a color name", "error");
      return;
    }

    if (isEditing && productId && editingVariant._id) {
      // Update variant via API
      try {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:5002/api";
        const response = await fetch(
          `${apiUrl}/products/${productId}/variants/${editingVariant._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("brandToken")}`,
            },
            body: JSON.stringify(formData),
          }
        );

        if (response.ok) {
          addNotification("Variant updated successfully", "success");
          fetchVariants();
          setEditingVariant(null);
          resetForm();
        } else {
          const error = await response.json();
          addNotification(error.error || "Failed to update variant", "error");
        }
      } catch (error) {
        addNotification("Error updating variant", "error");
      }
    } else {
      // Update variant locally for new products
      const updatedVariants = variants.map((v) =>
        v === editingVariant
          ? {
              ...v,
              ...formData,
              images: formData.images.filter((img) => img.trim() !== ""),
            }
          : v
      );
      onVariantsChange(updatedVariants);
      setEditingVariant(null);
      resetForm();
    }
  };

  const handleDeleteVariant = async (variant: Variant) => {
    if (isEditing && productId && variant._id) {
      // Delete variant via API
      try {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:5002/api";
        const response = await fetch(
          `${apiUrl}/products/${productId}/variants/${variant._id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("brandToken")}`,
            },
          }
        );

        if (response.ok) {
          addNotification("Variant deleted successfully", "success");
          fetchVariants();
        } else {
          const error = await response.json();
          addNotification(error.error || "Failed to delete variant", "error");
        }
      } catch (error) {
        addNotification("Error deleting variant", "error");
      }
    } else {
      // Delete variant locally for new products
      const updatedVariants = variants.filter((v) => v !== variant);
      onVariantsChange(updatedVariants);
    }
  };

  const resetForm = () => {
    setFormData({
      color: { name: "", hex: "#000000" },
      sizes: [""],
      images: [""],
      stock: 0,
      is_active: true,
    });
    setShowAddForm(false);
  };

  const startEdit = (variant: Variant) => {
    setEditingVariant(variant);
    setFormData({
      color: variant.color,
      sizes: variant.sizes.length > 0 ? variant.sizes : [""],
      images: variant.images.length > 0 ? variant.images : [""],
      stock: variant.stock,
      is_active: variant.is_active,
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingVariant(null);
    resetForm();
  };

  const addImageField = () => {
    setFormData({
      ...formData,
      images: [...formData.images, ""],
    });
  };

  const updateImageField = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const removeImageField = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      images: newImages.length > 0 ? newImages : [""],
    });
  };

  const addSizeField = () => {
    setFormData({
      ...formData,
      sizes: [...formData.sizes, ""],
    });
  };

  const updateSizeField = (index: number, value: string) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = value;
    setFormData({ ...formData, sizes: newSizes });
  };

  const removeSizeField = (index: number) => {
    const newSizes = formData.sizes.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      sizes: newSizes.length > 0 ? newSizes : [""],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Package className="w-5 h-5" />
          Product Variants
        </h3>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Add Variant
        </button>
      </div>

      {/* Variants List */}
      {variants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {variants.map((variant, index) => (
            <div
              key={index}
              className="glass rounded-2xl p-6 shadow-xl border border-white/20 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white/30 shadow-lg"
                    style={{ backgroundColor: variant.color.hex }}
                  ></div>
                  <span className="font-semibold text-white text-lg">
                    {variant.color.name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(variant)}
                    className="p-2 text-white/70 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-all duration-300"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVariant(variant)}
                    className="p-2 text-white/70 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Sizes:</span>
                  <div className="flex flex-wrap gap-1">
                    {variant.sizes.map((size, sizeIndex) => (
                      <span
                        key={sizeIndex}
                        className="px-2 py-1 bg-white/20 text-white text-xs rounded-lg"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Stock:</span>
                  <span className="font-semibold text-white">
                    {variant.stock}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Status:</span>
                  <span
                    className={`font-semibold ${
                      variant.is_active ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {variant.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {variant.images.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Images:</span>
                    <span className="font-semibold text-white">
                      {variant.images.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20 backdrop-blur-xl">
          <h4 className="text-2xl font-bold text-white mb-6 text-center">
            {editingVariant ? "Edit Variant" : "Add New Variant"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color Selection */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-3">
                <Palette className="w-5 h-5 inline mr-2" />
                Color
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Color name (e.g., Red, Blue)"
                  value={formData.color.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      color: { ...formData.color, name: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 text-white placeholder-white/50"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color.hex}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        color: { ...formData.color, hex: e.target.value },
                      })
                    }
                    className="w-12 h-12 border-2 border-white/30 rounded-xl cursor-pointer shadow-lg"
                  />
                  <span className="text-sm text-white/70 font-medium">
                    {formData.color.hex}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {commonColors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          color: { name: color.name, hex: color.hex },
                        })
                      }
                      className="w-10 h-10 rounded-xl border-2 border-white/30 hover:border-white/60 transition-all duration-300 shadow-lg hover:scale-110"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sizes Selection */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-3">
                <Package className="w-5 h-5 inline mr-2" />
                Available Sizes
              </label>
              <div className="space-y-2">
                {formData.sizes.map((size, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={size}
                      onChange={(e) => updateSizeField(index, e.target.value)}
                      className="flex-1 px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 text-white"
                    >
                      <option value="">Select Size</option>
                      {commonSizes.map((sizeOption) => (
                        <option key={sizeOption} value={sizeOption}>
                          {sizeOption}
                        </option>
                      ))}
                    </select>
                    {formData.sizes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSizeField(index)}
                        className="px-4 py-3 text-red-400 hover:bg-red-500/20 rounded-2xl transition-all duration-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSizeField}
                  className="flex items-center gap-2 px-4 py-3 text-blue-400 hover:bg-blue-500/20 rounded-2xl transition-all duration-300 w-full"
                >
                  <Plus className="w-4 h-4" />
                  Add Size
                </button>
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-3">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 text-white placeholder-white/50"
                placeholder="Enter stock quantity"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-3">
                Status
              </label>
              <select
                value={formData.is_active ? "active" : "inactive"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_active: e.target.value === "active",
                  })
                }
                className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Images */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-white/90 mb-3">
              <Image className="w-5 h-5 inline mr-2" />
              Variant Images
            </label>
            <div className="space-y-3">
              {formData.images.map((image, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="url"
                    placeholder="Image URL"
                    value={image}
                    onChange={(e) => updateImageField(index, e.target.value)}
                    className="flex-1 px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 text-white placeholder-white/50"
                  />
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="px-4 py-3 text-red-400 hover:bg-red-500/20 rounded-2xl transition-all duration-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                className="flex items-center gap-2 px-4 py-3 text-blue-400 hover:bg-blue-500/20 rounded-2xl transition-all duration-300 w-full"
              >
                <Plus className="w-4 h-4" />
                Add Image
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={editingVariant ? handleUpdateVariant : handleAddVariant}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {editingVariant ? "Update Variant" : "Add Variant"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="flex-1 px-6 py-4 glass text-white rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantManager;
