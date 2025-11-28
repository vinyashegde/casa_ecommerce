import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Check } from 'lucide-react';
import axios from 'axios';

// Types for the filter system
export interface FilterOptions {
  colors: string[];
  brands: Array<{ _id: string; name: string; logo_url?: string }>;
  categories: Array<{ _id: string; name: string }>;
  genders: string[];
  sizes: string[];
}

export interface ActiveFilters {
  colors: string[];
  brands: string[];
  categories: string[];
  gender: string;
  sizes: string[];
}

interface MasterFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onFiltersChange: (filters: ActiveFilters) => void;
  initialFilters?: Partial<ActiveFilters>;
  focusSection?: 'gender' | 'colors' | 'brands' | 'categories' | 'sizes';
}

// Predefined color options (can be extended based on your product data)
const AVAILABLE_COLORS = [
  { name: 'Black', value: 'black', color: '#000000' },
  { name: 'White', value: 'white', color: '#FFFFFF' },
  { name: 'Gray', value: 'gray', color: '#6B7280' },
  { name: 'Navy', value: 'navy', color: '#1E3A8A' },
  { name: 'Blue', value: 'blue', color: '#3B82F6' },
  { name: 'Red', value: 'red', color: '#EF4444' },
  { name: 'Green', value: 'green', color: '#10B981' },
  { name: 'Yellow', value: 'yellow', color: '#F59E0B' },
  { name: 'Pink', value: 'pink', color: '#EC4899' },
  { name: 'Purple', value: 'purple', color: '#8B5CF6' },
  { name: 'Brown', value: 'brown', color: '#92400E' },
  { name: 'Orange', value: 'orange', color: '#F97316' },
];

// Predefined size options
const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42'];

// Gender options
const GENDER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Men', value: 'male' },
  { label: 'Women', value: 'female' },
  { label: 'Unisex', value: 'unisex' },
];

const MasterFilters: React.FC<MasterFiltersProps> = ({
  isOpen,
  onClose,
  onFiltersChange,
  initialFilters = {},
  focusSection
}) => {
  // State for filter options loaded from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    colors: AVAILABLE_COLORS.map(c => c.value),
    brands: [],
    categories: [],
    genders: GENDER_OPTIONS.map(g => g.value),
    sizes: AVAILABLE_SIZES,
  });

  // State for active filters
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    colors: initialFilters.colors || [],
    brands: initialFilters.brands || [],
    categories: initialFilters.categories || [],
    gender: initialFilters.gender || 'all',
    sizes: initialFilters.sizes || [],
  });

  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    colors: true,
    brands: false,
    categories: false,
    gender: true,
    sizes: false,
  });

  // Loading state
  const [loading, setLoading] = useState(true);

  // Handle focus section when component opens
  useEffect(() => {
    if (isOpen && focusSection) {
      // Expand only the focused section and collapse others
      setExpandedSections({
        gender: focusSection === 'gender',
        colors: focusSection === 'colors',
        brands: focusSection === 'brands',
        categories: focusSection === 'categories',
        sizes: focusSection === 'sizes',
      });
      
      // Scroll to the focused section after a short delay
      setTimeout(() => {
        const sectionElement = document.getElementById(`filter-section-${focusSection}`);
        if (sectionElement) {
          sectionElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  }, [isOpen, focusSection]);

  // Fetch brands and categories from API
  const fetchFilterData = useCallback(async () => {
    setLoading(true);
    try {
      const [brandsResponse, categoriesResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/brands?limit=100`),
        axios.get(`${import.meta.env.VITE_API_URL}/categories/admin/all`)
      ]);

      const brands = brandsResponse.data.filter((brand: any) => brand.is_active);
      const categories = categoriesResponse.data.filter((cat: any) => !cat.parentCategory); // Only parent categories

      setFilterOptions(prev => ({
        ...prev,
        brands,
        categories,
      }));
    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchFilterData();
    }
  }, [isOpen, fetchFilterData]);

  // Sync local state with initial filters when they change
  useEffect(() => {
    setActiveFilters({
      colors: initialFilters.colors || [],
      brands: initialFilters.brands || [],
      categories: initialFilters.categories || [],
      gender: initialFilters.gender || 'all',
      sizes: initialFilters.sizes || [],
    });
  }, [initialFilters]);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle filter changes
  const handleColorToggle = (colorValue: string) => {
    setActiveFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(colorValue)
        ? prev.colors.filter(c => c !== colorValue)
        : [...prev.colors, colorValue]
    }));
  };

  const handleBrandToggle = (brandId: string) => {
    setActiveFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brandId)
        ? prev.brands.filter(b => b !== brandId)
        : [...prev.brands, brandId]
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setActiveFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleGenderChange = (gender: string) => {
    setActiveFilters(prev => ({
      ...prev,
      gender
    }));
  };

  const handleSizeToggle = (size: string) => {
    setActiveFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      colors: [],
      brands: [],
      categories: [],
      gender: 'all',
      sizes: [],
    };
    setActiveFilters(clearedFilters);
    onFiltersChange(clearedFilters); // Apply the cleared filters immediately
  };

  // Apply filters
  const applyFilters = () => {
    onFiltersChange(activeFilters);
    onClose();
  };

  // Count active filters
  const activeFilterCount = 
    activeFilters.colors.length +
    activeFilters.brands.length +
    activeFilters.categories.length +
    activeFilters.sizes.length +
    (activeFilters.gender !== 'all' ? 1 : 0);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Mobile-first responsive overlay */}
      <motion.div
        className="absolute inset-x-0 inset-y-0 md:inset-x-4 md:inset-y-4 md:max-w-sm my-14 md:mx-auto bg-gray-900 flex flex-col md:rounded-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable Filter Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                    <div className="space-y-2">
                      <div className="h-8 bg-gray-700/50 rounded"></div>
                      <div className="h-8 bg-gray-700/50 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Show only focused section if focusSection is provided, otherwise show all sections */}
                {focusSection ? (
                  <>
                    {/* Gender Filter */}
                    {focusSection === 'gender' && (
                <FilterSection
                  id="filter-section-gender"
                  title="Gender"
                  isExpanded={expandedSections.gender}
                  onToggle={() => toggleSection('gender')}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {GENDER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleGenderChange(option.value)}
                        className={`p-3 rounded-lg border transition-all ${
                          activeFilters.gender === option.value
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </FilterSection>
                    )}

                    {/* Colors Filter */}
                    {focusSection === 'colors' && (
                <FilterSection
                  id="filter-section-colors"
                  title="Colors"
                  isExpanded={expandedSections.colors}
                  onToggle={() => toggleSection('colors')}
                >
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleColorToggle(color.value)}
                        className="relative group justify-items-center"
                        title={color.name}
                      >
                        <div
                          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 transition-all ${
                            activeFilters.colors.includes(color.value)
                              ? 'border-blue-400 scale-110'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                          style={{
                            backgroundColor: color.color,
                            border: color.value === 'white' ? '2px solid #374151' : undefined
                          }}
                        >
                          {activeFilters.colors.includes(color.value) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check 
                                className={`w-5 h-5 ${
                                  color.value === 'white' || color.value === 'yellow' ? 'text-gray-800' : 'text-white'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 mt-1 block text-center">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </FilterSection>
                    )}

                    {/* Brands Filter */}
                    {focusSection === 'brands' && (
                <FilterSection
                  id="filter-section-brands"
                  title="Brands"
                  isExpanded={expandedSections.brands}
                  onToggle={() => toggleSection('brands')}
                >
                  <div className="space-y-2">
                    {filterOptions.brands.map((brand) => (
                      <button
                        key={brand._id}
                        onClick={() => handleBrandToggle(brand._id)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                          activeFilters.brands.includes(brand._id)
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="w-8 h-8 object-contain rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xs font-bold">
                            {brand.name.charAt(0)}
                          </div>
                        )}
                        <span className="flex-1 text-left">{brand.name}</span>
                        {activeFilters.brands.includes(brand._id) && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </FilterSection>
                    )}

                    {/* Categories Filter */}
                    {focusSection === 'categories' && (
                <FilterSection
                  id="filter-section-categories"
                  title="Categories"
                  isExpanded={expandedSections.categories}
                  onToggle={() => toggleSection('categories')}
                >
                  <div className="space-y-2">
                    {filterOptions.categories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => handleCategoryToggle(category._id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                          activeFilters.categories.includes(category._id)
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <span>{category.name}</span>
                        {activeFilters.categories.includes(category._id) && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </FilterSection>
                    )}

                    {/* Sizes Filter */}
                    {focusSection === 'sizes' && (
                <FilterSection
                  id="filter-section-sizes"
                  title="Sizes"
                  isExpanded={expandedSections.sizes}
                  onToggle={() => toggleSection('sizes')}
                >
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {AVAILABLE_SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSizeToggle(size)}
                        className={`p-2 rounded-lg border transition-all text-sm font-medium ${
                          activeFilters.sizes.includes(size)
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </FilterSection>
                    )}
                  </>
                ) : (
                  <>
                    {/* Show all sections when no focusSection is provided */}
                    {/* Gender Filter */}
                    <FilterSection
                      id="filter-section-gender"
                      title="Gender"
                      isExpanded={expandedSections.gender}
                      onToggle={() => toggleSection('gender')}
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {GENDER_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleGenderChange(option.value)}
                            className={`p-3 rounded-lg border transition-all ${
                              activeFilters.gender === option.value
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </FilterSection>

                    {/* Colors Filter */}
                    <FilterSection
                      id="filter-section-colors"
                      title="Colors"
                      isExpanded={expandedSections.colors}
                      onToggle={() => toggleSection('colors')}
                    >
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {AVAILABLE_COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => handleColorToggle(color.value)}
                            className="relative group justify-items-center"
                            title={color.name}
                          >
                            <div
                              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 transition-all ${
                                activeFilters.colors.includes(color.value)
                                  ? 'border-blue-400 scale-110'
                                  : 'border-gray-600 hover:border-gray-500'
                              }`}
                              style={{
                                backgroundColor: color.color,
                                border: color.value === 'white' ? '2px solid #374151' : undefined
                              }}
                            >
                              {activeFilters.colors.includes(color.value) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Check className="w-5 h-5 text-white drop-shadow-lg" />
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 mt-1 block text-center">{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </FilterSection>

                    {/* Brands Filter */}
                    <FilterSection
                      id="filter-section-brands"
                      title="Brands"
                      isExpanded={expandedSections.brands}
                      onToggle={() => toggleSection('brands')}
                    >
                      <div className="space-y-2">
                        {filterOptions.brands.map((brand) => (
                          <button
                            key={brand._id}
                            onClick={() => handleBrandToggle(brand._id)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                              activeFilters.brands.includes(brand._id)
                                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {brand.logo_url && (
                                <img
                                  src={brand.logo_url}
                                  alt={brand.name}
                                  className="w-6 h-6 object-contain"
                                />
                              )}
                              <span className="text-sm font-medium">{brand.name}</span>
                            </div>
                        {activeFilters.brands.includes(brand._id) && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                {/* Categories Filter */}
                <FilterSection
                  id="filter-section-categories"
                  title="Categories"
                  isExpanded={expandedSections.categories}
                  onToggle={() => toggleSection('categories')}
                >
                  <div className="space-y-2">
                    {filterOptions.categories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => handleCategoryToggle(category._id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                          activeFilters.categories.includes(category._id)
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <span className="text-sm font-medium">{category.name}</span>
                        {activeFilters.categories.includes(category._id) && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                {/* Sizes Filter */}
                <FilterSection
                  id="filter-section-sizes"
                  title="Sizes"
                  isExpanded={expandedSections.sizes}
                  onToggle={() => toggleSection('sizes')}
                >
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {AVAILABLE_SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSizeToggle(size)}
                        className={`p-2 rounded-lg border transition-all text-sm font-medium ${
                          activeFilters.sizes.includes(size)
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </FilterSection>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer Actions - Fixed at bottom */}
        <div className="p-4 border-t border-gray-800 space-y-3 flex-shrink-0">
          <div className="flex space-x-3">
            <button
              onClick={clearAllFilters}
              className="flex-1 py-3 px-4 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={applyFilters}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Helper component for filter sections
interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  id?: string;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  isExpanded,
  onToggle,
  children,
  id
}) => {
  return (
    <div id={id} className="space-y-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
          {title}
        </h3>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MasterFilters;