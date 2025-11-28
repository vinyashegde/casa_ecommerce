
interface Product {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  price: {
    $numberDecimal: string;
  };
  currency: string;
  sizes: string[];
  fits: string[];
  tags: string[];
  stock: number;
  gender: string;
  brand: {
    name: string;
    logo_url?: string;
  };
  category: string[];
}

// Enhanced filter interface for advanced filtering
export interface ProductFilters {
  colors?: string[];
  brands?: string[];
  categories?: string[];
  gender?: string;
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
}

const fetchProducts = async (
  page: number = 1,
  limit: number = 15,
  excludeIds: string[] = [],
  gender?: 'male' | 'female' | 'unisex',
  filters?: ProductFilters
): Promise<Product[]> => {
  try {
    // Determine the most specific API endpoint to use
    const genderFilter = filters?.gender && filters.gender !== 'all' ? filters.gender : gender;
    const hasMultipleFilters = filters && (
      (filters.brands && filters.brands.length > 0) ||
      (filters.categories && filters.categories.length > 0) ||
      (filters.sizes && filters.sizes.length > 0) ||
      (filters.colors && filters.colors.length > 0)
    );

    let allProducts: any[] = [];

    if (hasMultipleFilters) {
      // When we have advanced filters, we need to fetch from multiple endpoints
      // and do client-side filtering
      
      if (filters!.brands && filters!.brands.length > 0) {
        // Fetch products for each selected brand
        const brandPromises = filters!.brands.map(async (brandId) => {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/products/brand/${brandId}`);
          if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : [];
          }
          return [];
        });
        
        const brandResults = await Promise.all(brandPromises);
        allProducts = brandResults.flat();
      } else {
        // Fetch all products with basic filtering
        const params = new URLSearchParams();
        params.append('page', '1');
        params.append('limit', '100'); // Get more products for client-side filtering
        
        if (genderFilter && genderFilter !== 'all') {
          params.append('gender', genderFilter);
        }
        
        const baseUrl = genderFilter && genderFilter !== 'all' 
          ? `${import.meta.env.VITE_API_URL}/products/gender`
          : `${import.meta.env.VITE_API_URL}/products`;
        
        const response = await fetch(`${baseUrl}?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          allProducts = data.products || data || [];
        }
      }
    } else {
      // Simple case - use the most appropriate single endpoint
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (excludeIds.length > 0) {
        params.append('exclude', excludeIds.join(','));
      }
      
      if (genderFilter && genderFilter !== 'all') {
        params.append('gender', genderFilter);
      }
      
      const baseUrl = genderFilter && genderFilter !== 'all' 
        ? `${import.meta.env.VITE_API_URL}/products/gender`
        : `${import.meta.env.VITE_API_URL}/products`;
      
      const response = await fetch(`${baseUrl}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      allProducts = data.products || data || [];
    }

    // Transform the data to match the expected interface
    let transformedProducts = allProducts.map((product: any) => ({
      ...product,
      brand: typeof product.brand === 'string' 
        ? { name: product.brand, logo_url: undefined }
        : product.brand || { name: 'Unknown Brand', logo_url: undefined }
    }));

    // Apply client-side filtering for advanced filters
    if (filters) {
      // Gender filtering (if not already applied by API)
      if (filters.gender && filters.gender !== 'all' && !genderFilter) {
        transformedProducts = transformedProducts.filter((product: any) => 
          product.gender && product.gender.toLowerCase() === filters.gender!.toLowerCase()
        );
      }

      // Category filtering
      if (filters.categories && filters.categories.length > 0) {
        transformedProducts = transformedProducts.filter((product: any) => {
          if (!product.category) return false;
          const productCategories = Array.isArray(product.category) 
            ? product.category.map((cat: any) => cat._id || cat)
            : [product.category._id || product.category];
          return filters.categories!.some(catId => productCategories.includes(catId));
        });
      }

      // Size filtering
      if (filters.sizes && filters.sizes.length > 0) {
        transformedProducts = transformedProducts.filter((product: any) => {
          if (!product.sizes || !Array.isArray(product.sizes)) return false;
          return filters.sizes!.some(size => product.sizes.includes(size));
        });
      }

      // Color filtering (based on tags and product name)
      if (filters.colors && filters.colors.length > 0) {
        transformedProducts = transformedProducts.filter((product: any) => {
          const productText = `${product.name || ''} ${(product.tags || []).join(' ')}`.toLowerCase();
          return filters.colors!.some(color => 
            productText.includes(color.toLowerCase()) ||
            (product.tags || []).some((tag: string) => 
              tag.toLowerCase().includes(color.toLowerCase())
            )
          );
        });
      }

      // Price filtering
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        transformedProducts = transformedProducts.filter((product: any) => {
          const price = product.price?.$numberDecimal ? parseFloat(product.price.$numberDecimal) : 0;
          if (filters.minPrice !== undefined && price < filters.minPrice) return false;
          if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;
          return true;
        });
      }
    }

    // Apply exclusion filtering
    if (excludeIds.length > 0) {
      transformedProducts = transformedProducts.filter((product: any) => 
        !excludeIds.includes(product._id)
      );
    }

    // Remove duplicates based on _id
    const uniqueProducts = transformedProducts.reduce((acc: any[], product: any) => {
      if (!acc.find(p => p._id === product._id)) {
        acc.push(product);
      }
      return acc;
    }, []);

    // Apply pagination for client-side filtered results
    if (hasMultipleFilters) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return uniqueProducts.slice(startIndex, endIndex);
    }

    return uniqueProducts;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return [];
  }
};

export default fetchProducts;
