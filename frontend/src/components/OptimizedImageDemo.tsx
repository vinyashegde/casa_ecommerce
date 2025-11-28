import React, { useState, useEffect } from "react";
import {
  optimizedImageService,
  StaticImage,
} from "../services/optimizedImageService";

interface OptimizedImageDemoProps {
  category?: string;
  device?: string;
  limit?: number;
}

const OptimizedImageDemo: React.FC<OptimizedImageDemoProps> = ({
  category = "hero",
  device = "all",
  limit = 6,
}) => {
  const [images, setImages] = useState<StaticImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    loadImages();
  }, [category, device, limit]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const [imagesData, statsData] = await Promise.all([
        optimizedImageService.getAllImages({ category, device, limit }),
        optimizedImageService.getImageStats(),
      ]);

      setImages(imagesData);
      setStats(statsData);
      setIsCached(optimizedImageService.isCached());
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshImages = () => {
    optimizedImageService.clearCache();
    loadImages();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <span className="ml-2 text-gray-600">Loading optimized images...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Optimized Image Loading Demo
          </h3>
          <p className="text-gray-600">
            Category: {category} | Device: {device} | Limit: {limit}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isCached
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {isCached ? "📁 Cached" : "🌐 API"}
          </div>
          <button
            onClick={refreshImages}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {stats && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Image Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Images:</span>
              <span className="ml-2 font-semibold">{stats.totalImages}</span>
            </div>
            <div>
              <span className="text-gray-600">Last Updated:</span>
              <span className="ml-2 font-semibold">
                {new Date(stats.lastUpdated).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">By Category:</span>
              <span className="ml-2 font-semibold">
                {Object.keys(stats.imagesByCategory).length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">By Device:</span>
              <span className="ml-2 font-semibold">
                {Object.keys(stats.imagesByDevice).length}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <div
            key={image._id}
            className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=";
              }}
            />
            <div className="p-3">
              <h4 className="font-semibold text-gray-800 truncate">
                {image.name}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2">
                {image.description}
              </p>
              <div className="flex justify-between items-center mt-2">
                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                  {image.category}
                </span>
                <span className="text-xs text-gray-500">{image.device}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No images found for the selected criteria.
        </div>
      )}
    </div>
  );
};

export default OptimizedImageDemo;
