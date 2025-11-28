export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

export const preloadImages = async (urls: string[]): Promise<void> => {
  try {
    await Promise.all(urls.map(url => preloadImage(url)));
  } catch (error) {
    console.warn('Some images failed to preload:', error);
  }
};

export const createImageUrl = (path: string, baseUrl?: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  const base = baseUrl || '';
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getOptimizedImageUrl = (
  url: string, 
  width?: number, 
  height?: number, 
  quality: number = 80
): string => {
  // This can be extended to work with image optimization services
  // For now, return the original URL
  return url;
};