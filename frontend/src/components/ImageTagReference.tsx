/**
 * Image Tag Reference Component
 * Shows all the image tags used in HomePage for easy reference when adding images via CRM
 */

import React from "react";

const ImageTagReference: React.FC = () => {
  const imageTags = [
    // Hero Carousel Images
    {
      category: "Hero Carousel",
      tags: [
        {
          tag: "hero-banner",
          description: "Main hero banner image (MVP Collection)",
          priority: "High",
        },
        {
          tag: "flash-sale-banner",
          description: "Flash sale carousel image",
          priority: "High",
        },
        {
          tag: "new-arrivals-banner",
          description: "New arrivals carousel image",
          priority: "High",
        },
        {
          tag: "exclusive-banner",
          description: "Exclusive collection carousel image",
          priority: "High",
        },
      ],
    },
    // Flash Sale Offers
    {
      category: "Flash Sale Offers",
      tags: [
        {
          tag: "mega-sale-offer",
          description: "Mega sale offer image (50% OFF)",
          priority: "High",
        },
        {
          tag: "weekend-special-offer",
          description: "Weekend special offer image (20% OFF)",
          priority: "High",
        },
        {
          tag: "clearance-offer",
          description: "Clearance offer image (40% OFF)",
          priority: "High",
        },
        {
          tag: "bundle-deal-offer",
          description: "Bundle deal offer image (30% OFF)",
          priority: "High",
        },
      ],
    },
    // Special Collection Offers
    {
      category: "Special Collection Offers",
      tags: [
        {
          tag: "premium-collection-offer",
          description: "Premium collection offer image (₹2,999)",
          priority: "Medium",
        },
        {
          tag: "trendy-picks-offer",
          description: "Trendy picks offer image (From ₹799)",
          priority: "Medium",
        },
      ],
    },
    // Men's Iconic Looks
    {
      category: "Men's Iconic Looks",
      tags: [
        {
          tag: "men-streetwear-look",
          description: "Men's streetwear look image",
          priority: "Medium",
        },
        {
          tag: "men-formal-look",
          description: "Men's smart casual look image",
          priority: "Medium",
        },
        {
          tag: "men-casual-look",
          description: "Men's weekend warrior look image",
          priority: "Medium",
        },
      ],
    },
    // Women's Iconic Looks
    {
      category: "Women's Iconic Looks",
      tags: [
        {
          tag: "women-elegant-look",
          description: "Women's elegant queen look image",
          priority: "Medium",
        },
        {
          tag: "women-casual-look",
          description: "Women's weekend vibes look image",
          priority: "Medium",
        },
        {
          tag: "women-party-look",
          description: "Women's party ready look image",
          priority: "Medium",
        },
      ],
    },
  ];

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        HomePage Image Tags Reference
      </h2>
      <p className="text-gray-600 mb-6">
        Use these tags when adding images through the CRM. Images will
        automatically appear on the HomePage.
      </p>

      {imageTags.map((category, categoryIndex) => (
        <div key={categoryIndex} className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b-2 border-gray-300 pb-2">
            {category.category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.tags.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="bg-white p-4 rounded-lg shadow-sm border"
              >
                <div className="flex items-center justify-between mb-2">
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono text-gray-800">
                    {item.tag}
                  </code>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.priority === "High"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
        <ol className="text-blue-700 text-sm space-y-1">
          <li>1. Go to CRM Image Management</li>
          <li>2. Add new image with the exact tag name</li>
          <li>3. Set category as "hero", "offer", or "look"</li>
          <li>4. Set device as "all" for universal display</li>
          <li>5. Set priority (higher numbers = higher priority)</li>
          <li>6. Make sure "isActive" is set to true</li>
        </ol>
      </div>
    </div>
  );
};

export default ImageTagReference;
