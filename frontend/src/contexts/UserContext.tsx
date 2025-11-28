import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

export interface UserData {
  _id: string; // ✅ required
  role: number; // ✅ required
  phoneNumber?: string;
  name?: string;
  email: string; // ✅ Email is now required (primary identifier)
  dateOfBirth?: string;
  gender?: string;
  location?: string; // ✅ added here
  isLoggedIn: boolean;
  isNewUser: boolean;
  onboardingData?: {
    ageRange?: string;
    styleInterests?: string[];
    preferredFits?: string[];
  };
}

interface UserContextType {
  userData: UserData;
  setUserData: (data: UserData) => void;
  updateOnboardingData: (data: Partial<UserData['onboardingData']>) => void;
  completeOnboarding: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);
const STORAGE_KEY = 'casa_user_data';

// ✅ Validate if _id is a 24-char Mongo ObjectId
const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

const loadUserDataFromStorage = (): UserData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof parsed.isLoggedIn === 'boolean' &&
        parsed.isLoggedIn === true
      ) {
        return {
          _id: typeof parsed._id === 'string' ? parsed._id : '',
          role: typeof parsed.role === 'number' ? parsed.role : -1,
          phoneNumber: parsed.phoneNumber || '',
          name: parsed.name || '',
          email: typeof parsed.email === 'string' ? parsed.email : '',
          dateOfBirth: parsed.dateOfBirth || '',
          gender: parsed.gender || '',
          location: parsed.location || '',
          isLoggedIn: true,
          isNewUser: parsed.isNewUser ?? false,
          onboardingData: parsed.onboardingData || {}
        };
      }
    }
  } catch (error) {
    console.error('Error loading user data from localStorage:', error);
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    _id: '',
    role: -1,
    phoneNumber: '',
    name: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    location: '',
    isLoggedIn: false,
    isNewUser: false,
    onboardingData: {}
  };
};

const saveUserDataToStorage = (userData: UserData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data to localStorage:', error);
  }
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(loadUserDataFromStorage);

  useEffect(() => {
    saveUserDataToStorage(userData);
  }, [userData]);

  const updateOnboardingData = (data: Partial<UserData['onboardingData']>) => {
    setUserData(prev => ({
      ...prev,
      onboardingData: {
        ...prev.onboardingData,
        ...data
      }
    }));
  };

  const logout = () => {
    setUserData({
      _id: '',
      role: -1,
      phoneNumber: '',
      name: '',
      email: '',
      dateOfBirth: '',
      gender: '',
      location: '',
      isLoggedIn: false,
      isNewUser: false,
      onboardingData: {}
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const completeOnboarding = async () => {
    try {
      if (!userData.email) {
        throw new Error('Email is required to complete onboarding');
      }

      const userDataForBackend = {
        email: userData.email,
        phone: userData.phoneNumber || undefined,
        display_name: userData.name || userData.email.split('@')[0],
        interests: userData.onboardingData?.styleInterests || [],
        ml_preferences: userData.onboardingData?.preferredFits || [],
        age: userData.onboardingData?.ageRange?.includes('Gen Z') ? 22 :
             userData.onboardingData?.ageRange?.includes('Millennial') ? 30 : 25,
        last_login: new Date(),
        oauth_provider: null,
        oauth_id: null,
        avatar_url: null,
        gender: userData.gender || null,
        location: userData.location || null,
        is_admin: false,
        is_brand_user: false,
        followed_brand_ids: [],
        delivery_addresses: [],
        payment_methods: [],
        shipment: []
      };

      const response = await axios.post(import.meta.env.VITE_API_URL + '/users', userDataForBackend);

      setUserData(prev => ({
        ...prev,
        isNewUser: false,
        isLoggedIn: true,
        _id: response.data._id,
        role: response.data.role || 0
      }));
    } catch (error: any) {
      console.error('❌ Error registering user:', error);
      setUserData(prev => ({
        ...prev,
        isNewUser: false,
        isLoggedIn: true,
        _id: prev._id || '',
        role: prev.role || 0
      }));
    }
  };

  return (
    <UserContext.Provider value={{
      userData,
      setUserData,
      updateOnboardingData,
      completeOnboarding,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
