import React, { useState, useEffect, ComponentType } from 'react';
import PageLoader from './PageLoader';

interface WithPageLoaderOptions {
  loadingText?: string;
  minLoadingTime?: number;
  showLoader?: boolean;
}

const withPageLoader = <P extends object>(
  Component: ComponentType<P>,
  options: WithPageLoaderOptions = {}
) => {
  const {
    loadingText = "Loading page...",
    minLoadingTime = 500,
    showLoader = true
  } = options;

  return (props: P) => {
    const [isLoading, setIsLoading] = useState(showLoader);

    useEffect(() => {
      if (showLoader) {
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, minLoadingTime);

        return () => clearTimeout(timer);
      }
    }, []);

    if (isLoading) {
      return <PageLoader text={loadingText} />;
    }

    return <Component {...props} />;
  };
};

export default withPageLoader;