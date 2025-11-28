import axios from "axios";

const BASE_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:5002/api"
}/admin/static-images`;

// Test data
const testImage = {
  name: "Frontend Test Image",
  description: "Testing frontend-backend connection",
  url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
  category: "hero",
  device: "all",
  position: "hero-banner",
  isActive: true,
};

export const testImageAPI = async () => {
  try {
    console.log("🧪 Testing Frontend-Backend Image API Connection...\n");

    // Test 1: Create a new image
    console.log("1. Creating new image...");
    const createResponse = await axios.post(BASE_URL, testImage);
    console.log("✅ Image created:", createResponse.data);
    const imageId = createResponse.data.image._id;

    // Test 2: Get all images
    console.log("\n2. Fetching all images...");
    const getAllResponse = await axios.get(BASE_URL);
    console.log(
      "✅ Images fetched:",
      getAllResponse.data.images.length,
      "images"
    );

    // Test 3: Get single image
    console.log("\n3. Fetching single image...");
    const getSingleResponse = await axios.get(`${BASE_URL}/${imageId}`);
    console.log("✅ Single image fetched:", getSingleResponse.data.image.name);

    // Test 4: Update image
    console.log("\n4. Updating image...");
    const updateData = {
      name: "Updated Frontend Test Image",
      description: "Updated from frontend",
    };
    const updateResponse = await axios.put(
      `${BASE_URL}/${imageId}`,
      updateData
    );
    console.log("✅ Image updated:", updateResponse.data.image.name);

    // Test 5: Get images by category
    console.log("\n5. Fetching images by category...");
    const categoryResponse = await axios.get(`${BASE_URL}/category/hero`);
    console.log(
      "✅ Images by category:",
      categoryResponse.data.images.length,
      "hero images"
    );

    // Test 6: Toggle image status
    console.log("\n6. Toggling image status...");
    const toggleResponse = await axios.patch(`${BASE_URL}/${imageId}/toggle`);
    console.log("✅ Image status toggled:", toggleResponse.data.image.isActive);

    // Test 7: Get image stats
    console.log("\n7. Fetching image statistics...");
    const statsResponse = await axios.get(`${BASE_URL}/stats`);
    console.log("✅ Image stats:", statsResponse.data.stats);

    // Test 8: Delete image
    console.log("\n8. Deleting image...");
    const deleteResponse = await axios.delete(`${BASE_URL}/${imageId}`);
    console.log("✅ Image deleted:", deleteResponse.data.message);

    console.log("\n🎉 Frontend-Backend connection test passed successfully!");
    return true;
  } catch (error) {
    console.error(
      "❌ Frontend-Backend connection test failed:",
      error.response?.data || error.message
    );
    return false;
  }
};

// Export for use in components
export default testImageAPI;
