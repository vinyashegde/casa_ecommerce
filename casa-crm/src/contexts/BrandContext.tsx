import React, { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

console.log("API URL:", apiUrl);

// Define TypeScript interfaces
interface StoreAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  landmark?: string;
}

interface EmergencyContact {
  name: string;
  email: string;
  number: string;
  working_hours: string;
}

interface BankDetails {
  account_number: string;
  ifsc_code: string;
  upi_id: string;
}

export interface BrandData {
  _id: string;
  name: string;
  logo_url: string;
  description?: string;
  website?: string;
  email: string;
  password: string;
  social_links: string[];
  crm_user_ids?: string[];
  inventory_sync_status?: string;
  is_active: boolean;
  is_onboarded?: boolean;
  store_addresses: StoreAddress[];
  emergency_contact: EmergencyContact;
  return_policy?: string;
  shipping_policy?: string;
  store_policy?: string;
  bank_details: BankDetails;
  created_at?: string;
  updated_at?: string;
}

// Context value type
interface BrandContextType {
  brand: BrandData | null;
  setBrand: (brand: BrandData) => void;
  loginBrand: (email: string, password: string) => Promise<boolean>;
  logoutBrand: () => void;
  checkOnboardingStatus: () => Promise<{
    is_onboarded: boolean;
    is_complete: boolean;
    missing_fields: any;
  }>;
  getBrandProfile: () => Promise<any>;
  updateBrandProfile: (data: any) => Promise<any>;
}

// Create Context
const BrandContext = createContext<BrandContextType | undefined>(undefined);

// Provider component
export const BrandProvider = ({ children }: { children: ReactNode }) => {
  // Initialize brand from localStorage on mount
  const [brand, setBrand] = useState<BrandData | null>(() => {
    try {
      const storedBrand = localStorage.getItem("brandData");
      const storedToken = localStorage.getItem("brandToken");
      if (storedBrand && storedToken) {
        // Set authorization header for future requests
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${storedToken}`;
        return JSON.parse(storedBrand);
      }
    } catch (error) {
      console.error("Error parsing stored brand data:", error);
      // Clear corrupted data
      localStorage.removeItem("brandData");
      localStorage.removeItem("brandToken");
    }
    return null;
  });

  const loginBrand = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${apiUrl}/brands/login`, {
        email,
        password,
      });

      if (response.data.success && response.data.brand && response.data.token) {
        const brandData = response.data.brand;
        const token = response.data.token;

        setBrand(brandData);

        // Store in localStorage for persistence
        localStorage.setItem("brandData", JSON.stringify(brandData));
        localStorage.setItem("brandToken", token);

        // Set default authorization header for future requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Login error :", error.response?.data || error.message);
      return false;
    }
  };

  const logoutBrand = () => {
    try {
      // Clear brand state
      setBrand(null);

      // Clear all localStorage data
      localStorage.clear();

      // Clear authorization header
      delete axios.defaults.headers.common["Authorization"];

      console.log("✅ Logout successful - all data cleared");
    } catch (error) {
      console.error("❌ Error during logout:", error);
      // Force clear even if there's an error
      setBrand(null);
      localStorage.clear();
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const response = await axios.get(`${apiUrl}/brands/onboarding/status`);
      return response.data;
    } catch (error: any) {
      console.error("Error checking onboarding status:", error);
      throw error;
    }
  };

  const getBrandProfile = async () => {
    try {
      const response = await axios.get(`${apiUrl}/brands/profile`);
      return response.data;
    } catch (error: any) {
      console.error("Error getting brand profile:", error);
      throw error;
    }
  };

  const updateBrandProfile = async (data: any) => {
    try {
      const response = await axios.put(`${apiUrl}/brands/profile`, data);
      return response.data;
    } catch (error: any) {
      console.error("Error updating brand profile:", error);
      throw error;
    }
  };

  return (
    <BrandContext.Provider
      value={{
        brand,
        setBrand,
        loginBrand,
        logoutBrand,
        checkOnboardingStatus,
        getBrandProfile,
        updateBrandProfile,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};

// Hook to use context
export const useBrand = (): BrandContextType => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
};
