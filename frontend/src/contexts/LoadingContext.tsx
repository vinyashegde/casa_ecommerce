import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
  isAppLoading: boolean;
  isPageLoading: boolean;
  loadingText: string;
  setAppLoading: (loading: boolean) => void;
  setPageLoading: (loading: boolean, text?: string) => void;
  showPageLoader: (text?: string) => void;
  hidePageLoader: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isAppLoading, setAppLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  const setPageLoading = (loading: boolean, text?: string) => {
    setIsPageLoading(loading);
    if (text) {
      setLoadingText(text);
    }
  };

  const showPageLoader = (text: string = 'Loading...') => {
    setLoadingText(text);
    setIsPageLoading(true);
  };

  const hidePageLoader = () => {
    setIsPageLoading(false);
  };

  const value: LoadingContextType = {
    isAppLoading,
    isPageLoading,
    loadingText,
    setAppLoading,
    setPageLoading,
    showPageLoader,
    hidePageLoader
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};