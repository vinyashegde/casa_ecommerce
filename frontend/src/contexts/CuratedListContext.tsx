import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';

interface CuratedProduct {
  _id: string;
  name: string;
  price: number;
  images: string[];
  brand: {
    name: string;
    logo_url?: string;
  };
  category: string[];
  tags: string[];
}

interface CuratedListContextType {
  curatedProducts: CuratedProduct[];
  addToCuratedList: (product: CuratedProduct) => Promise<void>;
  removeFromCuratedList: (productId: string) => Promise<void>;
  isInCuratedList: (productId: string) => boolean;
  clearCuratedList: () => Promise<void>;
  curatedListCount: number;
  loading: boolean;
  error: string | null;
  refreshCuratedList: () => Promise<void>;
}

const CuratedListContext = createContext<CuratedListContextType | undefined>(undefined);

export const CuratedListProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userData } = useUser();
  const [curatedProducts, setCuratedProducts] = useState<CuratedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load curated list from backend when user logs in
  useEffect(() => {
    if (userData?.isLoggedIn && userData?._id) {
      refreshCuratedList();
    } else {
      // Clear curated list when user logs out
      setCuratedProducts([]);
    }
  }, [userData?.isLoggedIn, userData?._id]);

  const refreshCuratedList = async () => {
    if (!userData?.isLoggedIn || !userData?._id) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/curatedlist/${userData._id}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.products && Array.isArray(data.products)) {
          // Transform backend data to match frontend interface
          const transformedProducts = data.products.map((product: any) => ({
            _id: product._id,
            name: product.name,
            price: product.price?.$numberDecimal ? parseFloat(product.price.$numberDecimal) : product.price,
            images: product.images || [],
            brand: { 
              name: product.brand?.name || 'Unknown Brand',
              logo_url: product.brand?.logo_url 
            },
            category: product.category || [],
            tags: product.tags || []
          }));
          setCuratedProducts(transformedProducts);
        } else {
          setCuratedProducts([]);
        }
      } else if (response.status === 404) {
        // No curated list exists yet, create one
        await createCuratedList();
      } else {
        throw new Error(`Failed to fetch curated list: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching curated list:', err);
      setError('Failed to load curated list');
      // Fallback to empty list
      setCuratedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const createCuratedList = async () => {
    if (!userData?.isLoggedIn || !userData?._id) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/curatedlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData._id,
          products: [],
          name: 'My Curated List'
        }),
      });

      if (response.ok) {
        setCuratedProducts([]);
      } else {
        throw new Error(`Failed to create curated list: ${response.status}`);
      }
    } catch (err) {
      console.error('Error creating curated list:', err);
      setError('Failed to create curated list');
    }
  };

  const addToCuratedList = async (product: CuratedProduct) => {
    if (!userData?.isLoggedIn || !userData?._id) {
      throw new Error('User not logged in');
    }

    try {
      setError(null);
      
      // Check if product already exists
      if (curatedProducts.find(p => p._id === product._id)) {
        return; // Already in list
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/curatedlist/add`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData._id,
          productId: product._id,
        }),
      });

      if (response.ok) {
        // Add to local state immediately for better UX
        setCuratedProducts(prev => [...prev, product]);
      } else {
        throw new Error(`Failed to add product: ${response.status}`);
      }
    } catch (err) {
      console.error('Error adding to curated list:', err);
      setError('Failed to add product to curated list');
      throw err;
    }
  };

  const removeFromCuratedList = async (productId: string) => {
    if (!userData?.isLoggedIn || !userData?._id) {
      throw new Error('User not logged in');
    }

    try {
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/curatedlist/remove`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData._id,
          productId: productId,
        }),
      });

      if (response.ok) {
        // Remove from local state immediately for better UX
        setCuratedProducts(prev => prev.filter(p => p._id !== productId));
      } else {
        throw new Error(`Failed to remove product: ${response.status}`);
      }
    } catch (err) {
      console.error('Error removing from curated list:', err);
      setError('Failed to remove product from curated list');
      throw err;
    }
  };

  const isInCuratedList = (productId: string) => {
    return curatedProducts.some(p => p._id === productId);
  };

  const clearCuratedList = async () => {
    if (!userData?.isLoggedIn || !userData?._id) {
      throw new Error('User not logged in');
    }

    try {
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/curatedlist`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData._id,
        }),
      });

      if (response.ok) {
        setCuratedProducts([]);
      } else {
        throw new Error(`Failed to clear curated list: ${response.status}`);
      }
    } catch (err) {
      console.error('Error clearing curated list:', err);
      setError('Failed to clear curated list');
      throw err;
    }
  };

  const curatedListCount = curatedProducts.length;

  return (
    <CuratedListContext.Provider value={{
      curatedProducts,
      addToCuratedList,
      removeFromCuratedList,
      isInCuratedList,
      clearCuratedList,
      curatedListCount,
      loading,
      error,
      refreshCuratedList
    }}>
      {children}
    </CuratedListContext.Provider>
  );
};

export const useCuratedList = () => {
  const context = useContext(CuratedListContext);
  if (context === undefined) {
    throw new Error('useCuratedList must be used within a CuratedListProvider');
  }
  return context;
};

