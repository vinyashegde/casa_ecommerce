/**
 * React Hook for Image Management
 * Provides easy access to dynamic image management functionality
 */

import { useState, useEffect, useCallback } from "react";
import imageManagementService, {
  StaticImage,
} from "../services/imageManagementService";

interface UseImageManagementReturn {
  // Current image by tag
  currentImage: StaticImage | null;
  loading: boolean;
  error: string | null;

  // Multiple images by tag
  images: StaticImage[];
  imagesLoading: boolean;
  imagesError: string | null;

  // Seasonal images
  seasonalImages: StaticImage[];
  seasonalLoading: boolean;
  seasonalError: string | null;

  // Campaign images
  campaignImages: StaticImage[];
  campaignLoading: boolean;
  campaignError: string | null;

  // Actions
  getCurrentImage: (
    tag: string,
    device?: string
  ) => Promise<StaticImage | null>;
  getImages: (
    tag: string,
    device?: string,
    includeInactive?: boolean
  ) => Promise<StaticImage[]>;
  getSeasonalImages: (device?: string) => Promise<StaticImage[]>;
  getCampaignImages: (
    campaignId: string,
    device?: string
  ) => Promise<StaticImage[]>;
  preloadImages: (tags: string[], device?: string) => Promise<void>;
  clearCache: () => void;
  isImageActive: (image: StaticImage) => boolean;
  getBestImageForTag: (
    tag: string,
    device?: string
  ) => Promise<StaticImage | null>;
}

/**
 * Hook for managing a single current image by tag
 */
export const useCurrentImage = (
  tag: string,
  device?: string
): {
  image: StaticImage | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} => {
  const [image, setImage] = useState<StaticImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImage = useCallback(async () => {
    if (!tag) {
      setImage(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const currentDevice = device || imageManagementService.getDeviceType();
      const result = await imageManagementService.getCurrentImageByTag(
        tag,
        currentDevice
      );
      setImage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch image");
      setImage(null);
    } finally {
      setLoading(false);
    }
  }, [tag, device]);

  useEffect(() => {
    fetchImage();
  }, [fetchImage]);

  return {
    image,
    loading,
    error,
    refetch: fetchImage,
  };
};

/**
 * Hook for managing multiple images by tag
 */
export const useImagesByTag = (
  tag: string,
  device?: string,
  includeInactive: boolean = false
): {
  images: StaticImage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} => {
  const [images, setImages] = useState<StaticImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    if (!tag) {
      setImages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const currentDevice = device || imageManagementService.getDeviceType();
      const result = await imageManagementService.getImagesByTag(
        tag,
        currentDevice,
        includeInactive
      );
      setImages(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch images");
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [tag, device, includeInactive]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return {
    images,
    loading,
    error,
    refetch: fetchImages,
  };
};

/**
 * Hook for managing seasonal images
 */
export const useSeasonalImages = (
  device?: string
): {
  images: StaticImage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} => {
  const [images, setImages] = useState<StaticImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const currentDevice = device || imageManagementService.getDeviceType();
      const result = await imageManagementService.getSeasonalImages(
        currentDevice
      );
      setImages(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch seasonal images"
      );
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [device]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return {
    images,
    loading,
    error,
    refetch: fetchImages,
  };
};

/**
 * Hook for managing campaign images
 */
export const useCampaignImages = (
  campaignId: string,
  device?: string
): {
  images: StaticImage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} => {
  const [images, setImages] = useState<StaticImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    if (!campaignId) {
      setImages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const currentDevice = device || imageManagementService.getDeviceType();
      const result = await imageManagementService.getImagesByCampaign(
        campaignId,
        currentDevice
      );
      setImages(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch campaign images"
      );
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, device]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return {
    images,
    loading,
    error,
    refetch: fetchImages,
  };
};

/**
 * Comprehensive hook for image management
 */
export const useImageManagement = (): UseImageManagementReturn => {
  const [currentImage, setCurrentImage] = useState<StaticImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<StaticImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);

  const [seasonalImages, setSeasonalImages] = useState<StaticImage[]>([]);
  const [seasonalLoading, setSeasonalLoading] = useState(false);
  const [seasonalError, setSeasonalError] = useState<string | null>(null);

  const [campaignImages, setCampaignImages] = useState<StaticImage[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  const getCurrentImage = useCallback(
    async (tag: string, device?: string): Promise<StaticImage | null> => {
      try {
        setLoading(true);
        setError(null);
        const currentDevice = device || imageManagementService.getDeviceType();
        const result = await imageManagementService.getCurrentImageByTag(
          tag,
          currentDevice
        );
        setCurrentImage(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch current image";
        setError(errorMessage);
        setCurrentImage(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getImages = useCallback(
    async (
      tag: string,
      device?: string,
      includeInactive: boolean = false
    ): Promise<StaticImage[]> => {
      try {
        setImagesLoading(true);
        setImagesError(null);
        const currentDevice = device || imageManagementService.getDeviceType();
        const result = await imageManagementService.getImagesByTag(
          tag,
          currentDevice,
          includeInactive
        );
        setImages(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch images";
        setImagesError(errorMessage);
        setImages([]);
        return [];
      } finally {
        setImagesLoading(false);
      }
    },
    []
  );

  const getSeasonalImages = useCallback(
    async (device?: string): Promise<StaticImage[]> => {
      try {
        setSeasonalLoading(true);
        setSeasonalError(null);
        const currentDevice = device || imageManagementService.getDeviceType();
        const result = await imageManagementService.getSeasonalImages(
          currentDevice
        );
        setSeasonalImages(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch seasonal images";
        setSeasonalError(errorMessage);
        setSeasonalImages([]);
        return [];
      } finally {
        setSeasonalLoading(false);
      }
    },
    []
  );

  const getCampaignImages = useCallback(
    async (campaignId: string, device?: string): Promise<StaticImage[]> => {
      try {
        setCampaignLoading(true);
        setCampaignError(null);
        const currentDevice = device || imageManagementService.getDeviceType();
        const result = await imageManagementService.getImagesByCampaign(
          campaignId,
          currentDevice
        );
        setCampaignImages(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch campaign images";
        setCampaignError(errorMessage);
        setCampaignImages([]);
        return [];
      } finally {
        setCampaignLoading(false);
      }
    },
    []
  );

  const preloadImages = useCallback(
    async (tags: string[], device?: string): Promise<void> => {
      await imageManagementService.preloadImages(tags, device);
    },
    []
  );

  const clearCache = useCallback(() => {
    imageManagementService.clearCache();
  }, []);

  const isImageActive = useCallback((image: StaticImage): boolean => {
    return imageManagementService.isImageActive(image);
  }, []);

  const getBestImageForTag = useCallback(
    async (tag: string, device?: string): Promise<StaticImage | null> => {
      return await imageManagementService.getBestImageForTag(tag, device);
    },
    []
  );

  return {
    currentImage,
    loading,
    error,
    images,
    imagesLoading,
    imagesError,
    seasonalImages,
    seasonalLoading,
    seasonalError,
    campaignImages,
    campaignLoading,
    campaignError,
    getCurrentImage,
    getImages,
    getSeasonalImages,
    getCampaignImages,
    preloadImages,
    clearCache,
    isImageActive,
    getBestImageForTag,
  };
};

export default useImageManagement;

