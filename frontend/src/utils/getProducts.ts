import axios from 'axios'

export const handleSearch = async (query: string, navigate: any) => {
    //search implementation here
    try{
      if (query.trim()) {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/products/search`, {
          query 
        });
        navigate('/products', { state: res.data  })
      }
    } catch (err) {
      console.error(err)
    }
  };

// Get products for search suggestions and popular searches
export const getProductsForSearch = async (limit: number = 10) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/products?limit=${limit}`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching products for search:', error);
    return [];
  }
};

// Search products with better error handling
export const searchProducts = async (query: string) => {
  try {
    if (!query.trim()) return [];
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/products/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: query.trim() }),
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      console.error('Search API error:', response.status, response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};