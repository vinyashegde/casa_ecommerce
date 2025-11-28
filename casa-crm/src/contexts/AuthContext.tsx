import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import axios from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: "brand" | "admin";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize admin authentication on mount
  useEffect(() => {
    const initializeAdminAuth = () => {
      try {
        const storedAdmin = localStorage.getItem("adminData");
        const storedToken = localStorage.getItem("adminToken");

        if (storedAdmin && storedToken) {
          // Set authorization header for future requests
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${storedToken}`;

          // Restore admin data
          const adminData = JSON.parse(storedAdmin);
          setUser(adminData);
          console.log("✅ Admin authentication restored from localStorage");
        }
      } catch (error) {
        console.error("Error parsing stored admin data:", error);
        // Clear corrupted data
        localStorage.removeItem("adminData");
        localStorage.removeItem("adminToken");
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAdminAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simple validation - in real app, this would be an API call
    if (email && password) {
      const mockUser: User = {
        id: "1",
        name: "Alex Johnson",
        email: email,
        avatar:
          "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100",
        role: "brand",
      };
      setUser(mockUser);
      return true;
    }
    return false;
  };

  const adminLogin = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:8080/api";
      const response = await axios.post(`${apiUrl}/brands/admin/login`, {
        email,
        password,
      });

      if (response.data.success && response.data.token) {
        const adminUser: User = {
          id: response.data.admin.id,
          name: "Admin",
          email: response.data.admin.email,
          role: "admin",
        };

        const token = response.data.token;

        setUser(adminUser);

        // Store admin data and token in localStorage for persistence
        localStorage.setItem("adminData", JSON.stringify(adminUser));
        localStorage.setItem("adminToken", token);

        // Set authorization header for future requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        return true;
      }
      return false;
    } catch (error) {
      console.error("Admin login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);

    // Clear admin data from localStorage
    localStorage.removeItem("adminData");
    localStorage.removeItem("adminToken");

    // Clear authorization header
    delete axios.defaults.headers.common["Authorization"];

    console.log("✅ Admin logout successful - all data cleared");
  };

  const value = {
    user,
    login,
    adminLogin,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isInitialized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
