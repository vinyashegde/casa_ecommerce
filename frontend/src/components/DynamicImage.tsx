/**
 * DynamicImage Component
 * Displays images dynamically based on tags with fallback support
 */

import React, { useState, useEffect } from "react";
import { useCurrentImage } from "../hooks/useImageManagement";
import { StaticImage } from "../services/imageManagementService";

interface DynamicImageProps {
  tag: string;
  device?: string;
  fallbackSrc?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: () => void;
  showLoading?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  // Image-specific props
  width?: number | string;
  height?: number | string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  priority?: boolean;
}

const DynamicImage: React.FC<DynamicImageProps> = ({
  tag,
  device,
  fallbackSrc = "https://via.placeholder.com/400x300?text=Image+Not+Found",
  alt,
  className = "",
  style = {},
  loading = "lazy",
  onLoad,
  onError,
  showLoading = true,
  loadingComponent,
  errorComponent,
  width,
  height,
  objectFit = "cover",
  priority = false,
}) => {
  const { image, loading: imageLoading, error } = useCurrentImage(tag, device);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Determine the image source
  const imageSrc = image?.url || fallbackSrc;
  const imageAlt =
    alt || image?.altText || image?.name || `Dynamic image for ${tag}`;

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  // Reset error state when image changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [imageSrc]);

  // Show loading state
  if (imageLoading && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div
        className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  // Show error state
  if (error || imageError) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-gray-500 text-sm text-center p-4">
          <div>⚠️</div>
          <div>Image not available</div>
        </div>
      </div>
    );
  }

  // Show image
  return (
    <img
      src={imageSrc}
      alt={imageAlt}
      className={`${className} ${
        !imageLoaded ? "opacity-0" : "opacity-100"
      } transition-opacity duration-300`}
      style={{
        width,
        height,
        objectFit,
        ...style,
      }}
      loading={priority ? "eager" : loading}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
};

export default DynamicImage;

// Higher-order component for easy integration
export const withDynamicImage = <P extends object>(
  Component: React.ComponentType<P>,
  defaultProps: Partial<DynamicImageProps> = {}
) => {
  return React.forwardRef<HTMLImageElement, P & DynamicImageProps>(
    (props, ref) => {
      return <Component {...props} {...defaultProps} ref={ref} />;
    }
  );
};

// Utility component for multiple images
interface DynamicImageGalleryProps {
  tag: string;
  device?: string;
  maxImages?: number;
  fallbackSrc?: string;
  className?: string;
  imageClassName?: string;
  showLoading?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onImageClick?: (image: StaticImage, index: number) => void;
}

export const DynamicImageGallery: React.FC<DynamicImageGalleryProps> = ({
  tag,
  device,
  maxImages = 5,
  fallbackSrc,
  className = "",
  imageClassName = "",
  showLoading = true,
  loadingComponent,
  errorComponent,
  onImageClick,
}) => {
  const { images, loading, error } = useCurrentImage(tag, device);

  if (loading && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className={`flex space-x-2 ${className}`}>
        {Array.from({ length: maxImages }).map((_, index) => (
          <div
            key={index}
            className={`bg-gray-200 animate-pulse flex items-center justify-center ${imageClassName}`}
            style={{ width: 100, height: 100 }}
          >
            <div className="text-gray-400 text-xs">Loading...</div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-gray-500 text-sm">Failed to load images</div>
      </div>
    );
  }

  const displayImages = images.slice(0, maxImages);

  return (
    <div className={`flex space-x-2 ${className}`}>
      {displayImages.map((image, index) => (
        <DynamicImage
          key={image._id}
          tag={tag}
          device={device}
          fallbackSrc={fallbackSrc}
          className={`cursor-pointer hover:opacity-80 transition-opacity ${imageClassName}`}
          style={{ width: 100, height: 100 }}
          onClick={() => onImageClick?.(image, index)}
        />
      ))}
    </div>
  );
};

