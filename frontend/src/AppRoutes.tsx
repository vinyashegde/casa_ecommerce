import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import NavShell from "./components/NavShell";
import RequireAdmin from "./components/RequireAdmin";
import AdminLayout from "./components/AdminLayout";

import HomePage from "./pages/HomePage";
import CollectionPage from "./pages/CollectionPage";
import TrendsPage from "./pages/TrendsPage";
import OffersPage from "./pages/OffersPage";
import DealsPage from "./pages/DealsPage";
import SpecialOffersPage from "./pages/SpecialOffersPage";
import MyOffersPage from "./pages/MyOffersPage";
import BagPage from "./pages/BagPage";
import ProductPage from "./pages/ProductPage";
import ProfilePage from "./pages/ProfilePage";
import ManageAccountPage from "./pages/ManageAccountPage";
//import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import SearchPage from "./pages/SearchPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import SwipeProductsPage from "./pages/SwipeProductsPage";
import AllBrandsPage from "./pages/AllBrandsPage";
import BrandPage from "./pages/BrandPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProductsPage from "./pages/ProductsPage";
//import ProductsStarting799Page from './pages/ProductsStarting799Page';
import PrivacyPage from "./pages/PrivacyPage";
//import Home from './pages/crm/Home';

function AppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (!isAdminRoute) {
      import("./index.css");
    }
  }, [isAdminRoute]);

  return (
    <div
      className={
        isAdminRoute
          ? ""
          : "max-w-[414px] mx-auto bg-gray-900 text-white min-h-screen"
      }
    >
      <Routes>
        {/* ================================================================== */}
        {/* ORDER FIX: All specific, standalone routes now come FIRST.        */}
        {/* ================================================================== */}

        {/* <Route path="/products-starting-799" element={<ProductsStarting799Page />} /> */}
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/special-offers" element={<SpecialOffersPage />} />
        <Route path="/my-offers" element={<MyOffersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/manage-account" element={<ManageAccountPage />} />
        {/* <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} /> */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/product/:id" element={<ProductPage />} />

        {/* ================================================================== */}
        {/* The main nested route with the NavShell now comes AFTER          */}
        {/* the specific routes.                                             */}
        {/* ================================================================== */}

        <Route path="/" element={<NavShell />}>
          <Route index element={<HomePage />} />
          <Route path="collection" element={<CollectionPage />} />
          <Route path="trends" element={<TrendsPage />} />
          <Route path="bag" element={<BagPage />} />
          <Route path="swipe" element={<SwipeProductsPage />} />
          <Route path="brands" element={<AllBrandsPage />} />
          <Route path="brands/:brandId" element={<BrandPage />} />
          <Route path="products/:categoryId" element={<ProductsPage />} />
          <Route path="products" element={<ProductsPage />} />
        </Route>

        {/* ================================================================== */}
        {/* Admin and Catch-all routes remain at the end.                    */}
        {/* ================================================================== */}

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route
            index
            element={
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              </div>
            }
          />
        </Route>

        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">
                  404 - Page Not Found
                </h1>
                <p className="text-gray-400 mb-4">
                  The page you're looking for doesn't exist.
                </p>
                <p className="text-sm text-gray-500">
                  Current path: {location.pathname}
                </p>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default AppRoutes;
