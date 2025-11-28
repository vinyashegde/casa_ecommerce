// API Configuration
export const API_CONFIG = {
  // Default API URL - change this to your backend URL
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:5002/api",

  // Socket.IO URL (without /api)
  SOCKET_URL: (
    import.meta.env.VITE_API_URL || "http://localhost:5002/api"
  ).replace("/api", ""),
};

export default API_CONFIG;
