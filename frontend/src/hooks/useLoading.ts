import { useState, useEffect } from 'react';

interface UseLoadingOptions {
  minDuration?: number;
  initialDelay?: number;
}

export const useLoading = (
  asyncOperation?: () => Promise<any>,
  options: UseLoadingOptions = {}
) => {
  const { minDuration = 500, initialDelay = 0 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startLoading = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (initialDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, initialDelay));
      }

      const startTime = Date.now();
      
      if (asyncOperation) {
        await asyncOperation();
      }

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);
      
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    startLoading,
    setIsLoading
  };
};

export const usePageTransition = (duration: number = 300) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = () => {
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), duration);
  };

  return { isTransitioning, startTransition };
};