import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Camera,
  Package,
  DollarSign,
  Tag,
  FileText,
  AlertCircle,
  Check,
  Move,
  Sparkles,
  Plus,
} from "lucide-react";
import { useBrand } from "../contexts/BrandContext";
import { useNotifications } from "../contexts/NotificationContext";

interface ProductVariant {
  color: string;
  sizes: { size: string; stock: string }[];
  price: string;
  images: string[];
  sku: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  subcategory: string;
  brand: string;
  images: string[];
  tags: string[];
  currency: string;
  sizes: string[];
  fits: string[];
  stock: string;
  is_active: boolean;
  geo_tags: string[];
  gender: "male" | "female" | "unisex";
  assigned_coupon: string;
  offerPercentage: string;
  enableVariants: boolean;
  product_variants: ProductVariant[];
}

interface FormErrors {
  name?: string;
  price?: string;
  category?: string;
  brand?: string;
  sku?: string;
  stock?: string;
  general?: string;
  gender?: string;
  variants?: string;
}

const AddProduct = () => {
  const { brand } = useBrand();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [title, setTitle] = useState("Add New");
  const [description, setDescription] = useState("Create a new");
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    brand: "",
    images: [""],
    tags: [""],
    currency: "",
    sizes: [""],
    fits: [""],
    stock: "",
    is_active: false,
    geo_tags: [""],
    gender: "unisex",
    assigned_coupon: "",
    offerPercentage: "0",
    enableVariants: false,
    product_variants: [],
  });
  const location = useLocation();
  const editData = location.state?.product || null;

  // Populate brand field with logged-in brand
  useEffect(() => {
    if (brand?.name && !editData) {
      setFormData((prev) => ({
        ...prev,
        brand: brand.name,
      }));
    }
  }, [brand, editData]);

  useEffect(() => {
    if (editData) {
      console.log("Edit data received:", editData);
      console.log("Current brand from context:", brand?.name);

      // Extract category ID properly - we need the ID, not the name
      let categoryId = "";
      if (editData.category) {
        if (Array.isArray(editData.category)) {
          categoryId = editData.category[0]?._id || editData.category[0] || "";
        } else if (
          typeof editData.category === "object" &&
          editData.category._id
        ) {
          categoryId = editData.category._id;
        } else {
          categoryId = editData.category;
        }
      }

      console.log("Extracted category ID:", categoryId);

      // Extract price properly
      let priceValue = "";
      if (editData.price) {
        if (
          typeof editData.price === "object" &&
          editData.price.$numberDecimal
        ) {
          priceValue = editData.price.$numberDecimal;
        } else if (typeof editData.price === "number") {
          priceValue = String(editData.price);
        } else {
          priceValue = String(editData.price);
        }
      }

      console.log("Extracted price:", priceValue);

      // Initialize form data with proper defaults
      const initialFormData = {
        name: "",
        description: "",
        price: "",
        category: "",
        brand: "",
        images: [""],
        tags: [""],
        currency: "INR",
        sizes: [""],
        fits: [""],
        stock: "",
        is_active: false,
        geo_tags: [""],
        gender: "unisex",
        assigned_coupon: "",
        offerPercentage: "0",
        enableVariants: false,
        product_variants: [],
      };

      const populatedFormData = {
        ...initialFormData,
        // Always use the current brand name from context for consistency
        brand: brand?.name || editData.brand?.name || editData.brand || "",
        category: categoryId,
        subcategory: editData.subcategory || "",
        name: editData.name || "",
        description: editData.description || "",
        price: priceValue,
        currency: editData.currency || "INR",
        stock: String(editData.stock || ""),
        is_active: editData.is_active || false,
        gender: editData.gender || "unisex",
        assigned_coupon: editData.assigned_coupon || "",
        offerPercentage: String(editData.offerPercentage || "0"),
        // Handle arrays properly - ensure they're arrays and not empty
        images:
          Array.isArray(editData.images) && editData.images.length > 0
            ? editData.images
            : [""],
        tags:
          Array.isArray(editData.tags) && editData.tags.length > 0
            ? editData.tags
            : [""],
        sizes:
          Array.isArray(editData.sizes) && editData.sizes.length > 0
            ? editData.sizes
            : [""],
        fits:
          Array.isArray(editData.fits) && editData.fits.length > 0
            ? editData.fits
            : [""],
        geo_tags:
          Array.isArray(editData.geo_tags) && editData.geo_tags.length > 0
            ? editData.geo_tags
            : [""],
        // Handle variants
        enableVariants:
          Array.isArray(editData.product_variants) &&
          editData.product_variants.length > 0,
        product_variants:
          Array.isArray(editData.product_variants) &&
          editData.product_variants.length > 0
            ? editData.product_variants.map((variant: ProductVariant) => ({
                color: variant.color || "",
                sizes:
                  Array.isArray(variant.sizes) && variant.sizes.length > 0
                    ? variant.sizes.map(
                        (size: { size: string; stock: string | number }) => ({
                          size: size.size || "",
                          stock: String(size.stock || ""),
                        })
                      )
                    : [{ size: "", stock: "" }],
                price: variant.price ? String(variant.price) : "",
                images:
                  Array.isArray(variant.images) && variant.images.length > 0
                    ? variant.images
                    : [""],
                sku: variant.sku || "",
              }))
            : [],
      };

      console.log("Populated form data:", populatedFormData);
      setFormData(populatedFormData);
      setTitle("Edit");
      setDescription("Edit");
    }
  }, [editData, brand]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Dynamic categories from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [selectedParentCategory, setSelectedParentCategory] =
    useState<Category | null>(null);

  interface Category {
    _id: string;
    name: string;
    image: string;
    parentCategory?: {
      _id: string;
      name: string;
    };
  }

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const url = `${apiUrl}/categories/main`;

      console.log("🔍 Fetching categories...", {
        apiUrl: apiUrl,
        url: url,
      });

      const response = await fetch(url);

      console.log("📊 Categories API Response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setCategories(data);
          console.log("✅ Fetched categories:", data);
        } else {
          const text = await response.text();
          console.error("❌ Expected JSON but got:", text.substring(0, 200));
          throw new Error("Server returned non-JSON response");
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Failed to fetch categories:", {
          status: response.status,
          statusText: response.statusText,
          response: errorText.substring(0, 200),
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch subcategories for selected parent category
  const fetchSubcategories = async (parentId: string) => {
    try {
      setLoadingSubcategories(true);
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const url = `${apiUrl}/categories/${parentId}/subcategories`;

      console.log("🔍 Fetching subcategories...", {
        parentId: parentId,
        apiUrl: apiUrl,
        url: url,
      });

      const response = await fetch(url);

      console.log("📊 Subcategories API Response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          console.log("✅ Fetched subcategories:", data);
          setSubcategories(data);
        } else {
          const text = await response.text();
          console.error("❌ Expected JSON but got:", text.substring(0, 200));
          setSubcategories([]);
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Failed to fetch subcategories:", {
          status: response.status,
          statusText: response.statusText,
          response: errorText.substring(0, 200),
        });
        setSubcategories([]);
      }
    } catch (error) {
      console.error("❌ Error fetching subcategories:", error);
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Load subcategories when parent category changes
  useEffect(() => {
    console.log("Category change effect triggered:", {
      selectedCategory: formData.category,
      categoriesCount: categories.length,
    });

    if (formData.category) {
      const parentCategory = categories.find(
        (cat) => cat._id === formData.category
      );
      console.log("Found parent category:", parentCategory);

      if (parentCategory) {
        setSelectedParentCategory(parentCategory);
        fetchSubcategories(formData.category);
      }
    } else {
      console.log("No category selected, clearing subcategories");
      setSubcategories([]);
      setSelectedParentCategory(null);
    }
  }, [formData.category, categories]);

  // Create new category
  const createCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const url = `${apiUrl}/categories/admin`;

      console.log("🔍 Creating category...", {
        apiUrl: apiUrl,
        url: url,
        categoryName: newCategoryName.trim(),
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          image: "https://via.placeholder.com/300x200?text=Category+Image", // Default placeholder
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Category created:", data);
        setNewCategoryName("");
        setShowCategoryModal(false);
        await fetchCategories(); // Refresh categories
      } else {
        console.error("Failed to create category:", response.statusText);
      }
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  // Create new subcategory
  const createSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedParentCategory) return;

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const url = `${apiUrl}/categories/admin`;

      console.log("🔍 Creating subcategory...", {
        apiUrl: apiUrl,
        url: url,
        subcategoryName: newSubcategoryName.trim(),
        parentCategory: selectedParentCategory._id,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSubcategoryName.trim(),
          image: "https://via.placeholder.com/300x200?text=Subcategory+Image", // Default placeholder
          parentCategory: selectedParentCategory._id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Subcategory created:", data);
        setNewSubcategoryName("");
        setShowSubcategoryModal(false);
        await fetchSubcategories(selectedParentCategory._id); // Refresh subcategories
      } else {
        console.error("Failed to create subcategory:", response.statusText);
      }
    } catch (error) {
      console.error("Error creating subcategory:", error);
    }
  };

  const gender = ["male", "female", "unisex"];

  // Memoized click handlers to prevent unnecessary re-renders
  const handleCategoryClick = useCallback((categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      category: categoryId,
      subcategory: "",
    }));
  }, []);

  const handleSubcategoryClick = useCallback((subcategoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      subcategory: subcategoryId,
    }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    // If variants are enabled, validate variants instead of main product fields
    if (formData.enableVariants) {
      if (formData.product_variants.length === 0) {
        newErrors.variants =
          "At least one variant is required when variants are enabled";
      } else {
        // Validate each variant
        for (let i = 0; i < formData.product_variants.length; i++) {
          const variant = formData.product_variants[i];

          if (!variant.color.trim()) {
            newErrors.variants = `Variant ${i + 1}: Color is required`;
            break;
          }

          if (!variant.price.trim()) {
            newErrors.variants = `Variant ${i + 1}: Price is required`;
            break;
          } else if (
            isNaN(Number(variant.price)) ||
            Number(variant.price) <= 0
          ) {
            newErrors.variants = `Variant ${i + 1}: Please enter a valid price`;
            break;
          }

          if (variant.sizes.length === 0) {
            newErrors.variants = `Variant ${
              i + 1
            }: At least one size is required`;
            break;
          }

          // Validate sizes
          for (let j = 0; j < variant.sizes.length; j++) {
            const size = variant.sizes[j];
            if (!size.size.trim()) {
              newErrors.variants = `Variant ${i + 1}, Size ${
                j + 1
              }: Size is required`;
              break;
            }
            if (!size.stock.trim()) {
              newErrors.variants = `Variant ${i + 1}, Size ${
                j + 1
              }: Stock is required`;
              break;
            } else if (isNaN(Number(size.stock)) || Number(size.stock) < 0) {
              newErrors.variants = `Variant ${i + 1}, Size ${
                j + 1
              }: Please enter a valid stock quantity`;
              break;
            }
          }
        }
      }
    } else {
      // Validate main product fields when variants are disabled
      if (!formData.price.trim()) {
        newErrors.price = "Price is required";
      } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        newErrors.price = "Please enter a valid price";
      }

      if (!formData.stock.trim()) {
        newErrors.stock = "Stock quantity is required";
      } else if (isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
        newErrors.stock = "Please enter a valid stock quantity";
      }
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!formData.brand.trim()) {
      newErrors.brand = "Brand is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));
  };

  const addImageField = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ""],
    }));
  };

  const removeImageField = (index: number) => {
    if (formData.images.length > 1) {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        images: newImages,
      }));
    }
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData((prev) => ({
      ...prev,
      tags: newTags,
    }));
  };

  const handleSizesChange = (index: number, value: string) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = value;
    setFormData((prev) => ({
      ...prev,
      sizes: newSizes,
    }));
  };

  const handleFitsChange = (index: number, value: string) => {
    const newFits = [...formData.fits];
    newFits[index] = value;
    setFormData((prev) => ({
      ...prev,
      fits: newFits,
    }));
  };

  const handleGTagChange = (index: number, value: string) => {
    const newGeotag = [...formData.geo_tags];
    newGeotag[index] = value;
    setFormData((prev) => ({
      ...prev,
      geo_tags: newGeotag,
    }));
  };

  const addTagField = () => {
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, ""],
    }));
  };

  const addSizeField = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, ""],
    }));
  };

  const addFitField = () => {
    setFormData((prev) => ({
      ...prev,
      fits: [...prev.fits, ""],
    }));
  };

  const addGTagField = () => {
    setFormData((prev) => ({
      ...prev,
      geo_tags: [...prev.geo_tags, ""],
    }));
  };

  const removeTagField = (index: number) => {
    if (formData.tags.length > 1) {
      const newTags = formData.tags.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        tags: newTags,
      }));
    }
  };

  const removeSizeField = (index: number) => {
    if (formData.sizes.length > 1) {
      const newSizes = formData.sizes.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        sizes: newSizes,
      }));
    }
  };

  const removeFitField = (index: number) => {
    if (formData.fits.length > 1) {
      const newFits = formData.fits.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        fits: newFits,
      }));
    }
  };

  const removeGTagField = (index: number) => {
    if (formData.geo_tags.length > 1) {
      const newGTags = formData.geo_tags.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        geo_tags: newGTags,
      }));
    }
  };

  // Variant management functions
  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      product_variants: [
        ...prev.product_variants,
        {
          color: "",
          sizes: [{ size: "", stock: "" }],
          price: "",
          images: [""],
          sku: "",
        },
      ],
    }));
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      product_variants: prev.product_variants.filter((_, i) => i !== index),
    }));
  };

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      product_variants: prev.product_variants.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const addVariantSize = (variantIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      product_variants: prev.product_variants.map((variant, i) =>
        i === variantIndex
          ? { ...variant, sizes: [...variant.sizes, { size: "", stock: "" }] }
          : variant
      ),
    }));
  };

  const removeVariantSize = (variantIndex: number, sizeIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      product_variants: prev.product_variants.map((variant, i) =>
        i === variantIndex
          ? {
              ...variant,
              sizes: variant.sizes.filter((_, j) => j !== sizeIndex),
            }
          : variant
      ),
    }));
  };

  const updateVariantSize = (
    variantIndex: number,
    sizeIndex: number,
    field: "size" | "stock",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      product_variants: prev.product_variants.map((variant, i) =>
        i === variantIndex
          ? {
              ...variant,
              sizes: variant.sizes.map((size, j) =>
                j === sizeIndex ? { ...size, [field]: value } : size
              ),
            }
          : variant
      ),
    }));
  };

  const addVariantImage = (variantIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      product_variants: prev.product_variants.map((variant, i) =>
        i === variantIndex
          ? { ...variant, images: [...variant.images, ""] }
          : variant
      ),
    }));
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      product_variants: prev.product_variants.map((variant, i) =>
        i === variantIndex
          ? {
              ...variant,
              images: variant.images.filter((_, j) => j !== imageIndex),
            }
          : variant
      ),
    }));
  };

  const updateVariantImage = (
    variantIndex: number,
    imageIndex: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      product_variants: prev.product_variants.map((variant, i) =>
        i === variantIndex
          ? {
              ...variant,
              images: variant.images.map((img, j) =>
                j === imageIndex ? value : img
              ),
            }
          : variant
      ),
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const cleanedData = {
        ...formData,
        images: formData.images.filter((img) => img.trim() !== ""),
        tags: formData.tags.filter((tag) => tag.trim() !== ""),
        price: formData.enableVariants ? 0 : Number(formData.price), // Set to 0 if variants enabled
        stock: formData.enableVariants ? 0 : Number(formData.stock), // Set to 0 if variants enabled
        assigned_coupon: formData.assigned_coupon || null,
        offerPercentage: Number(formData.offerPercentage),
        product_variants: formData.enableVariants
          ? formData.product_variants.map((variant) => ({
              ...variant,
              price: Number(variant.price),
              sizes: variant.sizes.map((size) => ({
                ...size,
                stock: Number(size.stock),
              })),
              images: variant.images.filter((img) => img.trim() !== ""),
            }))
          : [],
      };

      console.log("Sending update data:", cleanedData);
      console.log("Brand name:", cleanedData.brand);
      console.log("Category name:", cleanedData.category);

      // Validate that brand and category names are not empty
      if (!cleanedData.brand || !cleanedData.category) {
        setErrors({
          general: "Brand and category are required for updating the product.",
        });
        setIsLoading(false);
        return;
      }

      // Additional validation: check if brand name matches the current brand
      if (brand?.name && cleanedData.brand !== brand.name) {
        console.warn(
          "Brand mismatch! Context brand:",
          brand.name,
          "Form brand:",
          cleanedData.brand
        );
        // Force use the current brand name
        cleanedData.brand = brand.name;
      }

      // Validate category is in the available categories list
      const categoryExists = categories.some(
        (cat) => cat._id === cleanedData.category
      );
      if (!categoryExists) {
        setErrors({
          general: `Invalid category. Please select a valid category.`,
        });
        setIsLoading(false);
        return;
      }

      // Optional: Validate brand and category exist in database (commented out for now to avoid issues)
      // const validation = await validateBrandAndCategory(
      //   cleanedData.brand,
      //   cleanedData.category
      // );
      // if (!validation.valid) {
      //   setErrors({
      //     general: validation.error || "Invalid brand or category name",
      //   });
      //   setIsLoading(false);
      //   return;
      // }

      console.log("✅ Brand and category validation passed");
      console.log("Final data being sent:", cleanedData);

      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const url = `${apiUrl}/products/update/${editData._id}`;

      console.log("🔍 Updating product...", {
        apiUrl: apiUrl,
        url: url,
        productId: editData._id,
        brand: brand,
        brandId: brand?._id,
        hasBrandToken: !!localStorage.getItem("brandToken"),
        productData: cleanedData,
      });

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("brandToken")}`,
        },
        body: JSON.stringify(cleanedData),
      });

      console.log("📊 Product Update Response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      if (response.ok) {
        console.log("✅ Product updated successfully");

        // Show success notification
        addNotification({
          type: "success",
          title: "Product Updated Successfully!",
          message: `Your product "${cleanedData.name}" has been updated.`,
          duration: 5000,
        });

        setIsSuccess(true);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        const errorData = await response.json();
        console.log("Update error:", errorData);
        setErrors({
          general:
            errorData.message ||
            errorData.error ||
            "Failed to update product. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setErrors({
        general: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Filter out empty images and tags
      const cleanedData = {
        ...formData,
        images: formData.images.filter((img) => img.trim() !== ""),
        tags: formData.tags.filter((tag) => tag.trim() !== ""),
        price: formData.enableVariants ? 0 : Number(formData.price), // Set to 0 if variants enabled
        stock: formData.enableVariants ? 0 : Number(formData.stock), // Set to 0 if variants enabled
        assigned_coupon: formData.assigned_coupon || null,
        offerPercentage: Number(formData.offerPercentage),
        product_variants: formData.enableVariants
          ? formData.product_variants.map((variant) => ({
              ...variant,
              price: Number(variant.price),
              sizes: variant.sizes.map((size) => ({
                ...size,
                stock: Number(size.stock),
              })),
              images: variant.images.filter((img) => img.trim() !== ""),
            }))
          : [],
      };

      console.log("Creating product with data:", cleanedData);
      console.log("Brand name:", cleanedData.brand);
      console.log("Category name:", cleanedData.category);

      // Validate that brand and category names are not empty
      if (!cleanedData.brand || !cleanedData.category) {
        setErrors({
          general: "Brand and category are required for creating the product.",
        });
        setIsLoading(false);
        return;
      }
      // Validate category is in the available categories list
      const categoryExists = categories.some(
        (cat) => cat._id === cleanedData.category
      );
      if (!categoryExists) {
        setErrors({
          general: `Invalid category. Please select a valid category.`,
        });
        setIsLoading(false);
        return;
      }

      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const url = `${apiUrl}/products/create`;

      console.log("🔍 Creating product...", {
        apiUrl: apiUrl,
        url: url,
        brand: brand,
        brandId: brand?._id,
        hasBrandToken: !!localStorage.getItem("brandToken"),
        productData: cleanedData,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("brandToken")}`,
        },
        body: JSON.stringify(cleanedData),
      });

      console.log("📊 Product Creation Response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      if (response.ok) {
        console.log(response);

        // Show success notification
        addNotification({
          type: "success",
          title: "Product Added Successfully!",
          message: `Your product "${cleanedData.name}" has been added to the catalog.`,
          duration: 5000,
        });

        setIsSuccess(true);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        const errorData = await response.json();
        console.log("Create product error:", errorData);
        setErrors({
          general:
            errorData.message ||
            errorData.error ||
            "Failed to create product. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setErrors({
        general: "Network error. Please check your connection and try again.",
      });
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
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-8 shadow-2xl shadow-green-500/25 animate-scale-in thunder-success lightning-pulse">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 lightning-text">
            {title === "Add New" ? "Product Added!" : "Product Updated!"}
          </h1>
          <p className="text-white/70 mb-8 text-lg">
            Your product has been successfully{" "}
            {title === "Add New" ? "Added" : "Updated"} to the catalog.
          </p>
          <Link
            to="/"
            className="inline-block w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-2xl font-bold hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-2xl hover:shadow-indigo-500/25 hover:scale-105 btn-thunder hover-thunder"
          >
            View Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-500/30 to-cyan-500/30 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="w-full max-w-7xl mx-auto relative z-10 px-6 py-8">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center">
            <Link
              to="/"
              className="inline-flex items-center text-white/60 hover:text-white transition-all duration-300 mr-8 group"
            >
              <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <ArrowLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform duration-300" />
              </div>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                {title} Product
              </h1>
              <p className="text-white/70 text-xl">
                {description} product listing with modern interface
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white/60 text-sm">Live Preview</span>
          </div>
        </div>

        {/* Enhanced Form Card */}
        <div className="glass rounded-3xl p-10 shadow-2xl border border-white/20 backdrop-blur-xl">
          <form
            onSubmit={title === "Add New" ? handleSubmit : handleUpdate}
            className="space-y-8"
          >
            {errors.general && (
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-2xl p-6 flex items-start space-x-4 animate-scale-in">
                <AlertCircle className="w-7 h-7 text-red-400 mt-0.5" />
                <div>
                  <p className="text-red-300 text-base font-medium">
                    {errors.general}
                  </p>
                </div>
              </div>
            )}

            {/* Basic Information Section */}
            <div className="space-y-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Basic Information
                </h2>
              </div>

              {/* Two-column layout for basic fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Name */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-white/90">
                    Product Name *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative">
                      <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-5 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus text-lg ${
                          errors.name
                            ? "focus:ring-red-500"
                            : "focus:ring-indigo-500"
                        }`}
                        placeholder="Enter product name"
                      />
                    </div>
                  </div>
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-2 animate-scale-in">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Price - Always show when variants are disabled */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-white/90">
                    Price *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                      <input
                        type="text"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        disabled={formData.enableVariants}
                        className={`w-full pl-12 pr-4 py-5 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus text-lg ${
                          formData.enableVariants
                            ? "opacity-50 cursor-not-allowed"
                            : errors.price
                            ? "focus:ring-red-500"
                            : "focus:ring-emerald-500"
                        }`}
                        placeholder={
                          formData.enableVariants
                            ? "Set price per variant"
                            : "0.00"
                        }
                      />
                    </div>
                  </div>
                  {formData.enableVariants && (
                    <p className="text-blue-400 text-sm mt-2">
                      💡 Price is set individually for each variant below
                    </p>
                  )}
                  {!formData.enableVariants && errors.price && (
                    <p className="text-red-400 text-sm mt-2 animate-scale-in">
                      {errors.price}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Variant Toggle Section */}
            <div className="space-y-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Product Variants
                </h2>
              </div>

              <div className="glass rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Enable Product Variants
                    </h3>
                    <p className="text-white/70 text-sm">
                      Enable this to create multiple color/size combinations
                      with individual pricing and stock
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableVariants}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          enableVariants: e.target.checked,
                          // Clear variants when disabling
                          product_variants: e.target.checked
                            ? prev.product_variants
                            : [],
                        }));
                        // Clear variant errors when toggling
                        if (errors.variants) {
                          setErrors((prev) => ({
                            ...prev,
                            variants: undefined,
                          }));
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {errors.variants && (
                  <div className="mt-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-4 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <p className="text-red-300 text-sm font-medium">
                      {errors.variants}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Variants Management Section */}
            {formData.enableVariants && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    Product Variants
                  </h3>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:from-violet-600 hover:to-purple-600 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-purple-500/25"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {formData.product_variants.map((variant, variantIndex) => (
                    <div
                      key={variantIndex}
                      className="glass rounded-2xl p-6 border border-white/20"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-semibold text-white">
                          Variant {variantIndex + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeVariant(variantIndex)}
                          className="w-10 h-10 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 rounded-xl hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 flex items-center justify-center hover:scale-110"
                        >
                          ×
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Color */}
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-white/90">
                            Color *
                          </label>
                          <div className="space-y-3">
                            {/* Color Palette */}
                            <div className="grid grid-cols-6 gap-2">
                              {[
                                { name: "Red", value: "#ef4444" },
                                { name: "Blue", value: "#3b82f6" },
                                { name: "Green", value: "#10b981" },
                                { name: "Yellow", value: "#f59e0b" },
                                { name: "Purple", value: "#8b5cf6" },
                                { name: "Pink", value: "#ec4899" },
                                { name: "Orange", value: "#f97316" },
                                { name: "Teal", value: "#14b8a6" },
                                { name: "Indigo", value: "#6366f1" },
                                { name: "Gray", value: "#6b7280" },
                                { name: "Black", value: "#000000" },
                                { name: "White", value: "#ffffff" },
                              ].map((color) => (
                                <button
                                  key={color.value}
                                  type="button"
                                  onClick={() =>
                                    updateVariant(
                                      variantIndex,
                                      "color",
                                      color.name
                                    )
                                  }
                                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-300 hover:scale-110 ${
                                    variant.color === color.name
                                      ? "border-white shadow-lg shadow-white/50"
                                      : "border-white/30 hover:border-white/60"
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  title={color.name}
                                />
                              ))}
                            </div>

                            {/* Custom Color Input */}
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={
                                  variant.color && variant.color.startsWith("#")
                                    ? variant.color
                                    : "#000000"
                                }
                                onChange={(e) =>
                                  updateVariant(
                                    variantIndex,
                                    "color",
                                    e.target.value
                                  )
                                }
                                className="w-12 h-10 rounded-lg border border-white/30 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={variant.color}
                                onChange={(e) =>
                                  updateVariant(
                                    variantIndex,
                                    "color",
                                    e.target.value
                                  )
                                }
                                className="flex-1 px-3 py-2 glass border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus text-sm"
                                placeholder="Custom color name or hex"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-white/90">
                            Price *
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400" />
                              <input
                                type="text"
                                value={variant.price}
                                onChange={(e) =>
                                  updateVariant(
                                    variantIndex,
                                    "price",
                                    e.target.value
                                  )
                                }
                                className="w-full pl-10 pr-4 py-3 glass border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </div>

                        {/* SKU */}
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-white/90">
                            SKU (Optional)
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                            <div className="relative">
                              <input
                                type="text"
                                value={variant.sku}
                                onChange={(e) =>
                                  updateVariant(
                                    variantIndex,
                                    "sku",
                                    e.target.value
                                  )
                                }
                                className="w-full px-4 py-3 glass border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus"
                                placeholder="e.g., RED-M-L"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Variant Images */}
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-white/90">
                            Variant Images
                          </label>
                          <div className="space-y-2">
                            {variant.images.map((image, imageIndex) => (
                              <div
                                key={imageIndex}
                                className="flex items-center space-x-2"
                              >
                                <div className="relative flex-1 group">
                                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                                  <div className="relative">
                                    <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400" />
                                    <input
                                      type="url"
                                      value={image}
                                      onChange={(e) =>
                                        updateVariantImage(
                                          variantIndex,
                                          imageIndex,
                                          e.target.value
                                        )
                                      }
                                      className="w-full pl-10 pr-4 py-3 glass border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus text-sm"
                                      placeholder="https://example.com/image.jpg"
                                    />
                                  </div>
                                </div>
                                {variant.images.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeVariantImage(
                                        variantIndex,
                                        imageIndex
                                      )
                                    }
                                    className="w-8 h-8 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 rounded-lg hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 flex items-center justify-center hover:scale-110"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addVariantImage(variantIndex)}
                              className="w-full py-2 glass text-white/70 hover:text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2 font-medium hover:scale-105 group text-sm"
                            >
                              <Upload className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                              <span>Add Image</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Sizes Section */}
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-semibold text-white/90">
                            Sizes *
                          </label>
                          <button
                            type="button"
                            onClick={() => addVariantSize(variantIndex)}
                            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm rounded-lg hover:from-violet-600 hover:to-purple-600 transition-all duration-300 flex items-center space-x-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Size</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {variant.sizes.map((size, sizeIndex) => (
                            <div
                              key={sizeIndex}
                              className="glass rounded-xl p-4 border border-white/20"
                            >
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-semibold text-white/90 mb-1">
                                    Size
                                  </label>
                                  <input
                                    type="text"
                                    value={size.size}
                                    onChange={(e) =>
                                      updateVariantSize(
                                        variantIndex,
                                        sizeIndex,
                                        "size",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 glass border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus text-sm"
                                    placeholder="e.g., S, M, L"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-white/90 mb-1">
                                    Stock
                                  </label>
                                  <input
                                    type="number"
                                    value={size.stock}
                                    onChange={(e) =>
                                      updateVariantSize(
                                        variantIndex,
                                        sizeIndex,
                                        "stock",
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    className="w-full px-3 py-2 glass border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus text-sm"
                                    placeholder="0"
                                  />
                                </div>
                                {variant.sizes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeVariantSize(variantIndex, sizeIndex)
                                    }
                                    className="w-full py-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 rounded-lg hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 flex items-center justify-center hover:scale-105 text-xs"
                                  >
                                    Remove Size
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category & Classification Section */}
            <div className="space-y-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Tag className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Category & Classification
                </h2>
              </div>

              {/* Two-column layout for category fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-white/90">
                      Category *
                    </label>
                    {/* <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-emerald-500/25"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Category</span>
                    </button> */}
                  </div>

                  {loadingCategories ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                      <span className="ml-4 text-white/70 text-lg">
                        Loading categories...
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-3">
                      {categories.map((category) => (
                        <div
                          key={category._id}
                          onClick={() => handleCategoryClick(category._id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 active:scale-95 ${
                            formData.category === category._id
                              ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/25"
                              : "border-white/20 bg-white/5 hover:border-purple-300 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-10 h-10 rounded-xl object-cover"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/40x40?text=📁";
                              }}
                            />
                            <span className="text-white text-base font-medium truncate">
                              {category.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.category && (
                    <p className="text-red-400 text-sm mt-2 animate-scale-in">
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Subcategory Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-white/90">
                      Subcategory
                    </label>
                    {/* <button
                      type="button"
                      onClick={() => setShowSubcategoryModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-purple-500/25"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Subcategory</span>
                    </button> */}
                  </div>

                  {formData.category ? (
                    loadingSubcategories ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <span className="ml-4 text-white/70 text-base">
                          Loading subcategories...
                        </span>
                      </div>
                    ) : subcategories.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-3">
                        {subcategories.map((subcategory) => (
                          <div
                            key={subcategory._id}
                            onClick={() =>
                              handleSubcategoryClick(subcategory._id)
                            }
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 active:scale-95 ${
                              formData.subcategory === subcategory._id
                                ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/25"
                                : "border-white/20 bg-white/5 hover:border-purple-300 hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={subcategory.image}
                                alt={subcategory.name}
                                className="w-8 h-8 rounded-lg object-cover"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/32x32?text=📂";
                                }}
                              />
                              <span
                                className={`text-sm font-medium truncate ${
                                  formData.subcategory === subcategory._id
                                    ? "text-purple-100 font-semibold"
                                    : "text-white"
                                }`}
                              >
                                {subcategory.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-white/50 text-base mb-4">
                          No subcategories available for this category
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSubcategoryModal(true)}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-base rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center space-x-2 mx-auto shadow-lg hover:shadow-purple-500/25"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Add First Subcategory</span>
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-white/50 text-base">
                        Please select a category first
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Quantity and Gender in one row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Stock Quantity - Always show */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-white/90">
                    Stock Quantity *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative">
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        min="0"
                        disabled={formData.enableVariants}
                        className={`w-full px-4 py-5 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus text-lg ${
                          formData.enableVariants
                            ? "opacity-50 cursor-not-allowed"
                            : errors.stock
                            ? "focus:ring-red-500"
                            : "focus:ring-cyan-500"
                        }`}
                        placeholder={
                          formData.enableVariants
                            ? "Set stock per variant"
                            : "Enter stock quantity"
                        }
                      />
                    </div>
                  </div>
                  {formData.enableVariants && (
                    <p className="text-blue-400 text-sm mt-2">
                      💡 Stock is set individually for each variant size below
                    </p>
                  )}
                  {!formData.enableVariants && errors.stock && (
                    <p className="text-red-400 text-sm mt-2 animate-scale-in">
                      {errors.stock}
                    </p>
                  )}
                </div>

                {/* Gender Selection */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-white/90">
                    Gender *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative">
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-5 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:bg-white/20 transition-all duration-300 text-white input-focus text-lg ${
                          errors.gender
                            ? "focus:ring-red-500"
                            : "focus:ring-pink-500"
                        }`}
                      >
                        <option value="" className="text-black">Select a gender</option>
                        {gender.map((gender) => (
                          <option key={gender} value={gender} className="text-black">
                            {gender.charAt(0).toUpperCase() + gender.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {errors.gender && (
                    <p className="text-red-400 text-sm mt-2 animate-scale-in">
                      {errors.gender}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Brand & Coupon Section */}
            <div className="space-y-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Brand & Offers
                </h2>
              </div>

              {/* Two-column layout for offer and coupon fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Offer Percentage */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-white/90">
                    Offer Percentage
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
                      <select
                        name="offerPercentage"
                        value={formData.offerPercentage}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-5 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:bg-white/20 transition-all duration-300 text-white input-focus focus:ring-amber-500 text-lg"
                      >
                        <option value="0" className="text-black">No Offer</option>
                        <option value="10" className="text-black">10% Off</option>
                        <option value="20" className="text-black">20% Off</option>
                        <option value="30" className="text-black">30% Off</option>
                        <option value="40" className="text-black">40% Off</option>
                        <option value="50" className="text-black">50% Off</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Coupon Assignment */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-white/90">
                    Assign Coupon (Optional)
                  </label>
                  {brand?._id ? (
                    <CouponSelector
                      selectedCoupon={formData.assigned_coupon}
                      onCouponSelect={(couponId) =>
                        setFormData({ ...formData, assigned_coupon: couponId })
                      }
                      brandId={brand._id}
                    />
                  ) : (
                    <div className="text-base text-white/70 py-5">
                      Loading brand information...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content & Media Section */}
            <div className="space-y-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Content & Media
                </h2>
              </div>

              {/* Brand and Description in one row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Brand */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-white/90">
                    Brand *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative">
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-5 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus text-lg ${
                          errors.brand
                            ? "focus:ring-red-500"
                            : "focus:ring-cyan-500"
                        }`}
                        placeholder="Brand name will be auto-filled"
                        readOnly={!!brand?.name}
                      />
                    </div>
                  </div>
                  {errors.brand && (
                    <p className="text-red-400 text-sm mt-2 animate-scale-in">
                      {errors.brand}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-white/90">
                    Description
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 w-6 h-6 text-emerald-400" />
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={5}
                        className="w-full pl-14 pr-4 py-5 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 resize-none input-focus text-lg"
                        placeholder="Describe your product in detail..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Images - Only show when variants are disabled */}
              {!formData.enableVariants && (
                <div className="space-y-6">
                  <label className="block text-sm font-semibold text-white/90">
                    Product Images
                  </label>
                  <div className="space-y-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="relative flex-1 group">
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                          <div className="relative">
                            <Camera className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-emerald-400" />
                            <input
                              type="url"
                              value={image}
                              onChange={(e) =>
                                handleImageChange(index, e.target.value)
                              }
                              className="w-full pl-14 pr-4 py-5 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus text-lg"
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>
                        </div>
                        {formData.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(index)}
                            className="w-14 h-14 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 rounded-2xl hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 flex items-center justify-center hover:scale-110 shadow-lg"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addImageField}
                      className="w-full py-6 glass text-white/70 hover:text-white rounded-2xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-4 font-medium hover:scale-105 group shadow-lg"
                    >
                      <Upload className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="text-lg">Add Image URL</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Variant Images Note */}
              {formData.enableVariants && (
                <div className="space-y-6">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Camera className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-blue-400">
                        Product Images
                      </h3>
                    </div>
                    <p className="text-blue-300 text-sm leading-relaxed">
                      💡 <strong>Images are managed through variants.</strong>{" "}
                      Each variant can have its own set of images. The first
                      variant's images will be used as the default product
                      images throughout the system.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tags & Attributes Section */}
            <div className="space-y-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Tag className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Tags & Attributes
                </h2>
              </div>

              {/* Four-column layout for all attributes */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Tags */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-3">
                      Tags
                    </label>

                    <div className="space-y-2">
                      {formData.tags.map((tag, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={tag}
                            onChange={(e) =>
                              handleTagChange(index, e.target.value)
                            }
                            className="flex-1 px-3 py-3 glass border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus text-sm"
                            placeholder="Enter tag"
                          />
                          {formData.tags.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTagField(index)}
                              className="w-8 h-8 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 rounded-lg hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 flex items-center justify-center hover:scale-110"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addTagField}
                        className="w-full py-3 glass text-white/70 hover:text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2 font-medium hover:scale-105 group text-sm"
                      >
                        <Tag className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        <span>Add Tag</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Geo Tags */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-3">
                      Geo-Tags
                    </label>
                    <div className="space-y-2">
                      {formData.geo_tags.map((geo_tag, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={geo_tag}
                            onChange={(e) =>
                              handleGTagChange(index, e.target.value)
                            }
                            className="flex-1 px-3 py-3 glass border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus text-sm"
                            placeholder="Enter geo tag"
                          />
                          {formData.geo_tags.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeGTagField(index)}
                              className="w-8 h-8 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 rounded-lg hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 flex items-center justify-center hover:scale-110"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addGTagField}
                        className="w-full py-3 glass text-white/70 hover:text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2 font-medium hover:scale-105 group text-sm"
                      >
                        <Tag className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        <span>Add Geo Tag</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sizes */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-3">
                      Sizes
                    </label>
                    {formData.enableVariants && (
                      <p className="text-blue-400 text-xs mb-3">
                        💡 These are general sizes. Individual stock per size is
                        set in variants below.
                      </p>
                    )}
                    <div className="space-y-2">
                      {formData.sizes.map((size, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={size}
                            onChange={(e) =>
                              handleSizesChange(index, e.target.value)
                            }
                            className="flex-1 px-3 py-3 glass border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus text-sm"
                            placeholder="Enter size"
                          />
                          {formData.sizes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSizeField(index)}
                              className="w-8 h-8 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 rounded-lg hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 flex items-center justify-center hover:scale-110"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addSizeField}
                        className="w-full py-3 glass text-white/70 hover:text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2 font-medium hover:scale-105 group text-sm"
                      >
                        <Move className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                        <span>Add Size</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fits */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-3">
                      Fits
                    </label>
                    <div className="space-y-2">
                      {formData.fits.map((fit, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={fit}
                            onChange={(e) =>
                              handleFitsChange(index, e.target.value)
                            }
                            className="flex-1 px-3 py-3 glass border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white/20 transition-all duration-300 text-white placeholder-white/50 input-focus text-sm"
                            placeholder="Enter fit"
                          />
                          {formData.fits.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFitField(index)}
                              className="w-8 h-8 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 rounded-lg hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 flex items-center justify-center hover:scale-110"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addFitField}
                        className="w-full py-3 glass text-white/70 hover:text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2 font-medium hover:scale-105 group text-sm"
                      >
                        <Move className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                        <span>Add Fit</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <div className="pt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-6 rounded-3xl font-bold hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-500 shadow-2xl hover:shadow-purple-500/25 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center space-x-4 text-xl">
                  {isLoading ? (
                    <>
                      <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
                      <span>
                        {title === "Add New"
                          ? "✨ Add Product"
                          : "🔄 Update Product"}
                      </span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 w-full max-w-md glass rounded-3xl shadow-2xl border border-white/20 backdrop-blur-xl">
            <div className="mt-3">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl">
                <Plus className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-2xl font-bold text-white">
                  Add New Category
                </h3>
                <p className="text-white/70 text-sm mt-2">
                  Enter the category name
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 text-white placeholder-white/50"
                    autoFocus
                  />
                </div>

                <div className="flex space-x-4 mt-8">
                  <button
                    onClick={createCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Category</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowCategoryModal(false);
                      setNewCategoryName("");
                    }}
                    className="flex-1 px-6 py-4 glass text-white rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subcategory Creation Modal */}
      {showSubcategoryModal && selectedParentCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 w-full max-w-md glass rounded-3xl shadow-2xl border border-white/20 backdrop-blur-xl">
            <div className="mt-3">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl">
                <Plus className="w-8 h-8 text-purple-400" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-2xl font-bold text-white">
                  Add New Subcategory
                </h3>
                <p className="text-white/70 text-sm mt-2">
                  Under{" "}
                  <span className="font-semibold text-purple-300">
                    {selectedParentCategory.name}
                  </span>
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    Subcategory Name
                  </label>
                  <input
                    type="text"
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    placeholder="Enter subcategory name"
                    className="w-full px-4 py-3 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 text-white placeholder-white/50"
                    autoFocus
                  />
                </div>

                <div className="flex space-x-4 mt-8">
                  <button
                    onClick={createSubcategory}
                    disabled={!newSubcategoryName.trim()}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Subcategory</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSubcategoryModal(false);
                      setNewSubcategoryName("");
                    }}
                    className="flex-1 px-6 py-4 glass text-white rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Coupon Selector Component
interface CouponSelectorProps {
  selectedCoupon: string;
  onCouponSelect: (couponId: string) => void;
  brandId?: string;
}

const CouponSelector: React.FC<CouponSelectorProps> = ({
  selectedCoupon,
  onCouponSelect,
  brandId,
}) => {
  const [coupons, setCoupons] = useState<
    {
      _id: string;
      code: string;
      title: string;
      coupon_code: string;
      discount_type: string;
      discount_value: number;
      discount_percentage: number;
      applies_to: string;
      is_active: boolean;
      is_currently_valid: boolean;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const fetchCoupons = useCallback(async () => {
    if (!brandId || brandId === "undefined") {
      console.log("No valid brandId provided");
      return;
    }

    try {
      setLoading(true);
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const url = `${apiUrl}/offers/brand/${brandId}`;

      console.log("🔍 Fetching coupons...", {
        apiUrl: apiUrl,
        url: url,
        brandId: brandId,
        hasBrandToken: !!localStorage.getItem("brandToken"),
      });

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("brandToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched coupons data:", data);
        if (data.success) {
          // Show all active coupons that can be assigned to products
          const activeCoupons = data.data.filter(
            (coupon: { is_active: boolean; is_currently_valid: boolean }) =>
              coupon.is_active && coupon.is_currently_valid
          );
          console.log("Active coupons:", activeCoupons);
          setCoupons(activeCoupons);
        }
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    console.log("CouponSelector - brandId:", brandId);
    if (brandId && brandId !== "undefined") {
      fetchCoupons();
    }
  }, [brandId, fetchCoupons]);

  return (
    <div className="space-y-4">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
        <div className="relative">
          <select
            value={selectedCoupon}
            onChange={(e) => onCouponSelect(e.target.value)}
            className="w-full px-4 py-5 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white/20 transition-all duration-300 text-white text-lg"
          >
            <option value="" className="text-gray-800 px-4">
              No coupon assigned
            </option>
            {loading ? (
              <option disabled className="text-gray-800">
                Loading coupons...
              </option>
            ) : (
              coupons.map((coupon) => (
                <option
                  key={coupon._id}
                  value={coupon._id}
                  className="text-gray-800 px-4"
                >
                  {coupon.title} - {coupon.coupon_code} (
                  {coupon.discount_type === "percentage"
                    ? `${coupon.discount_value}% OFF`
                    : `₹${coupon.discount_value} OFF`}
                  ) -{" "}
                  {coupon.applies_to === "all_products"
                    ? "All Products"
                    : "Specific Products"}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {selectedCoupon && (
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl p-4">
          <p className="text-cyan-200 text-sm font-medium">
            ✅ Selected coupon will be applied to this product
          </p>
        </div>
      )}
    </div>
  );
};

export default AddProduct;
