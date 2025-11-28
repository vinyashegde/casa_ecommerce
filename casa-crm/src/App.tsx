import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { BrandProvider } from "./contexts/BrandContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import CategoryManagement from "./pages/CategoryManagement";
import BrandSignup from "./pages/BrandSignup";
import ForgotPassword from "./pages/ForgotPassword";
import Products from "./pages/Products";
import RegisterBrand from "./pages/RegisterBrand";
import AddProduct from "./pages/AddProduct";
import CreateBrandForm from "./pages/CreateBrand";
import Order from "./pages/Order";
import ShopifyImport from "./pages/ShopifyImport";
import Offers from "./pages/Offers";
import ImageManagement from "./pages/ImageManagement";
import Payments from "./pages/Payments";
import BrandOnboarding from "./pages/BrandOnboarding";
import BrandProfile from "./pages/BrandProfile";

function App() {
  return (
    <AuthProvider>
      <BrandProvider>
        <SocketProvider>
          <NotificationProvider>
            <Router>
              <div className="min-h-screen">
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/signup" element={<BrandSignup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  {/* Admin routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminProtectedRoute>
                        <AdminLayout>
                          <AdminDashboard />
                        </AdminLayout>
                      </AdminProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/brands"
                    element={
                      <AdminProtectedRoute>
                        <AdminLayout>
                          <AdminDashboard />
                        </AdminLayout>
                      </AdminProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/categories"
                    element={
                      <AdminProtectedRoute>
                        <AdminLayout>
                          <CategoryManagement />
                        </AdminLayout>
                      </AdminProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/images"
                    element={
                      <AdminProtectedRoute>
                        <AdminLayout>
                          <ImageManagement />
                        </AdminLayout>
                      </AdminProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/payments"
                    element={
                      <AdminProtectedRoute>
                        <AdminLayout>
                          <Payments />
                        </AdminLayout>
                      </AdminProtectedRoute>
                    }
                  />

                  {/* Onboarding route - no onboarding check required */}
                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute requireOnboarding={false}>
                        <BrandOnboarding />
                      </ProtectedRoute>
                    }
                  />

                  {/* Brand routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    {/* <Route index element={<Dashboard />} /> */}
                    <Route index element={<Products />} />
                    <Route path="orders" element={<Order />} />
                    <Route path="products/add" element={<AddProduct />} />
                    <Route path="register-brand" element={<RegisterBrand />} />
                    {/* <Route path="sales" element={<Sales />} /> */}
                    <Route path="create-brand" element={<CreateBrandForm />} />
                    <Route path="shopify-import" element={<ShopifyImport />} />
                    <Route path="offers" element={<Offers />} />
                    <Route path="profile" element={<BrandProfile />} />
                  </Route>
                </Routes>
              </div>
            </Router>
          </NotificationProvider>
        </SocketProvider>
      </BrandProvider>
    </AuthProvider>
  );
}

export default App;
