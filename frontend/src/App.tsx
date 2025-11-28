import React, { useState, useEffect } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { CartProvider } from "./contexts/CartContext";
import { CuratedListProvider } from "./contexts/CuratedListContext";
import { ImageProvider } from "./contexts/ImageContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import SplashScreen from "./components/SplashScreen";
import SpecialOffersPage from "./pages/SpecialOffersPage";
import NavShell from "./components/NavShell";
import BrandValidationError from "./components/BrandValidationError";
import HomePage from "./pages/HomePage";
import CollectionPage from "./pages/CollectionPage";
import TrendsPage from "./pages/TrendsPage";
import OffersPage from "./pages/OffersPage";
import DealsPage from "./pages/DealsPage";
import BagPage from "./pages/BagPage";
import ProductPage from "./pages/ProductPage";
import ProfilePage from "./pages/ProfilePage";
import ManageAccountPage from "./pages/ManageAccountPage"; // NEW: Manage Account page
import SearchPage from "./pages/SearchPage";
import ChatPage from "./pages/ChatPage"; // ✅ make sure it's imported
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import SwipeProductsPage from "./pages/SwipeProductsPage";
import AllBrandsPage from "./pages/AllBrandsPage";
import BrandPage from "./pages/BrandPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProductsPage from "./pages/ProductsPage";
import CuratedListPage from "./pages/CuratedListPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import StyleQuiz from "./pages/StyleQuiz";
import IconicLookPage from "./pages/IconicLookPage";
import LoadingDemo from "./components/LoadingDemo";
import "./index.css";
import LocationPage from "./pages/LocationPage";
import PrivacyPage from "./pages/PrivacyPage";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Simulate app initialization
    const initializeApp = async () => {
      // Add any app initialization logic here
      // e.g., checking auth status, loading critical data, etc.
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading
      setIsAppReady(true);
    };

    initializeApp();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash || !isAppReady) {
    return <SplashScreen onFinished={handleSplashFinish} duration={2500} />;
  }

  return (
    <div className="mobile-container">
      <LoadingProvider>
        <UserProvider>
          <CartProvider>
            <CuratedListProvider>
              <ImageProvider>
                <Router>
                  <div className="min-h-screen bg-gray-900 text-white mobile-scroll">
                    <Routes>
                      <Route path="/" element={<NavShell />}>
                        <Route index element={<SwipeProductsPage />} />
                        <Route path="home" element={<HomePage />} />
                        <Route path="collection" element={<CollectionPage />} />
                        <Route path="trends" element={<TrendsPage />} />
                        <Route path="bag" element={<BagPage />} />
                        <Route path="swipe" element={<SwipeProductsPage />} />
                      </Route>
                      <Route path="/brands" element={<AllBrandsPage />} />
                      <Route path="/brands/:brandId" element={<BrandPage />} />
                      <Route path="/offers" element={<OffersPage />} />
                      <Route path="/deals" element={<DealsPage />} />
                      <Route path="/special-offers" element={<SpecialOffersPage />} />
                      <Route path="/location" element={<LocationPage />} />
                      <Route
                        path="/products/:categoryId"
                        element={<ProductsPage />}
                      />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/product/:id" element={<ProductPage />} />
                      <Route
                        path="/curatedList"
                        element={<CuratedListPage />}
                      />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/my-orders" element={<MyOrdersPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />
                      <Route
                        path="/manage-account"
                        element={<ManageAccountPage />}
                      />{" "}
                      {/* NEW: Manage Account route */}
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route
                        path="/order-success"
                        element={<OrderSuccessPage />}
                      />
                      <Route path="/onboarding" element={<OnboardingPage />} />
                      <Route path="/style-quiz" element={<StyleQuiz />} />
                      <Route
                        path="/look/:lookId"
                        element={<IconicLookPage />}
                      />
                      <Route path="/chat" element={<ChatPage />} />{" "}
                      <Route path="/loading-demo" element={<LoadingDemo />} />
                      {/* ✅ Add this line */}
                    </Routes>
                    <BrandValidationError />
                  </div>
                </Router>
              </ImageProvider>
            </CuratedListProvider>
          </CartProvider>
        </UserProvider>
      </LoadingProvider>
    </div>
  );
}

export default App;
