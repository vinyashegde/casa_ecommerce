import React, { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useBrand } from "../contexts/BrandContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireOnboarding = true,
}) => {
  const { brand, checkOnboardingStatus } = useBrand();
  const [isChecking, setIsChecking] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<{
    is_onboarded: boolean;
    is_complete: boolean;
  } | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      // First check authentication
      if (
        !brand &&
        !localStorage.getItem("brandData") &&
        !localStorage.getItem("brandToken")
      ) {
        setIsChecking(false);
        return;
      }

      // If we're on the onboarding page, don't check onboarding status
      if (location.pathname === "/onboarding") {
        setIsChecking(false);
        return;
      }

      // Check onboarding status if required
      if (requireOnboarding) {
        try {
          const status = await checkOnboardingStatus();
          setOnboardingStatus(status);
        } catch (error) {
          console.error("Error checking onboarding status:", error);
        }
      }

      setIsChecking(false);
    };

    checkAuthAndOnboarding();
  }, [brand, checkOnboardingStatus, location.pathname, requireOnboarding]);

  // Show loading while checking authentication and onboarding
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-white/70">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Check both context and localStorage
  const isAuthenticated =
    brand ||
    (localStorage.getItem("brandData") && localStorage.getItem("brandToken"));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check onboarding status if required
  if (requireOnboarding && onboardingStatus && !onboardingStatus.is_onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
