import React, { useState, useEffect, useRef } from "react";

import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  FileText,
  Shield,
  ChevronRight,
  LogOut,
  X,
  Gift,
} from "lucide-react";
import LoginPopup from "../components/LoginPopup";
import { useUser } from "../contexts/UserContext";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

interface Address {
  _id: string;
  billing_customer_name: string;
  billing_address: string;
  billing_address_2: string;
  billing_city: string;
  billing_state: string;
  billing_pincode: string;
  billing_country: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { userData, logout } = useUser();
  const isLoggedIn = userData.isLoggedIn;

  // New state for addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [showAddresses, setShowAddresses] = useState(false);

  // Ref for scrolling to addresses section
  const addressesSectionRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    navigate("/");
  };

  type MenuItem = {
    icon: any;
    label: string;
    hasChevron: boolean;
    isLogout?: boolean;
  };

  const baseMenuItems: MenuItem[] = [
    { icon: Package, label: "My Orders", hasChevron: false },
    { icon: Gift, label: "My Offers", hasChevron: true },
    { icon: User, label: "Manage Account", hasChevron: true },
    { icon: MapPin, label: "Addresses", hasChevron: true },
    { icon: FileText, label: "Terms & Conditions", hasChevron: true },
    { icon: Shield, label: "Privacy Policy", hasChevron: true },
  ];

  const menuItems: MenuItem[] = isLoggedIn
    ? [
        ...baseMenuItems,
        { icon: LogOut, label: "Log Out", hasChevron: true, isLogout: true },
      ]
    : baseMenuItems;

  const handleLogout = () => {
    logout();
  };

  const handleMenuClick = (label: string) => {
    if (label === "Log Out") {
      handleLogout();
    } else if (label === "Terms & Conditions") {
      setShowTermsModal(true);
    } else if (label === "Privacy Policy") {
      navigate("/privacy");
    } else if (
      !isLoggedIn &&
      ["My Orders", "My Offers", "Manage Account", "Addresses"].includes(label)
    ) {
      setIsLoginPopupOpen(true);
    } else {
      switch (label) {
        case "My Orders":
          navigate("/my-orders");
          break;
        case "My Offers":
          navigate("/my-offers");
          break;
        case "Manage Account":
          navigate("/manage-account");
          break;
        case "Addresses":
          // Toggle addresses visibility
          setShowAddresses(!showAddresses);
          if (!showAddresses) {
            // If showing addresses, scroll to the section after a brief delay
            setTimeout(() => {
              addressesSectionRef.current?.scrollIntoView({
                behavior: "smooth",
              });
            }, 100);
          }
          break;
        default:
          console.log(`Menu item clicked: ${label}`);
      }
    }
  };

  const handleSignUp = () => {
    setIsLoginPopupOpen(true);
  };

  const handleLoginClose = () => {
    setIsLoginPopupOpen(false);
  };

  const handleLoginContinue = (phoneNumber: string) => {
    console.log("Login with phone number:", phoneNumber);
    setIsLoginPopupOpen(false);
  };

  // Fetch order count
  useEffect(() => {
    const fetchOrderCount = async () => {
      if (isLoggedIn && userData._id) {
        try {
          const response = await axios.get(
            `${API_BASE}/orders/user/${userData._id}`
          );
          if (response.data.success) {
            setOrderCount(response.data.orders.length);
          }
        } catch (error) {
          console.error("Error fetching order count:", error);
        }
      }
    };

    fetchOrderCount();
  }, [isLoggedIn, userData._id]);

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isLoggedIn || !userData._id) {
        setLoadingAddresses(false);
        return;
      }

      setLoadingAddresses(true);
      try {
        const response = await axios.get(
          `${API_BASE}/users/${userData._id}/shipment`
        );
        setAddresses(response.data.shipments || []);
      } catch (err) {
        console.error("Failed to fetch addresses:", err);
        setAddressError("Failed to load addresses.");
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [isLoggedIn, userData._id]);

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="px-4 py-6">
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 rounded-2xl"></div>
          <div className="relative z-10">
            {isLoggedIn ? (
              <>
                <h2 className="text-2xl font-bold mb-1">
                  {userData.name ||
                    `User ${userData.email?.split("@")[0] || "User"}` ||
                    "User"}
                </h2>
                <p className="text-gray-300 text-sm mb-1">
                  {userData.email || "No email address"}
                </p>
                {userData.phoneNumber && (
                  <p className="text-gray-300 text-sm mb-1">
                    {userData.phoneNumber}
                  </p>
                )}
                <p className="text-gray-300 text-sm mb-4">Lvl 00</p>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User size={32} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  Welcome to Your Profile
                </h2>
                <p className="text-gray-300 text-sm mb-6">
                  Sign up or log in to access your account
                </p>
                <button
                  onClick={handleSignUp}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full transition-colors"
                >
                  Sign Up / Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Package size={20} className="text-gray-400 mr-2" />
              <span className="text-xs text-blue-400 font-medium">
                Order Count
              </span>
            </div>
            <p className="text-2xl font-bold">{orderCount}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4">
        <div className="grid grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`bg-gray-800 hover:bg-gray-700 rounded-xl p-4 flex flex-col items-center space-y-2 transition-colors text-center ${
                item.isLogout
                  ? "col-span-3 !flex-row !space-x-3 !text-left"
                  : ""
              }`}
              onClick={() => handleMenuClick(item.label)}
            >
              <item.icon size={20} className="text-gray-400" />
              <div className="flex items-center w-full">
                <span
                  className={`text-sm font-medium ${
                    item.isLogout ? "text-red-400" : "text-white"
                  }`}
                >
                  {item.label}
                </span>
                {item.hasChevron && (
                  <ChevronRight size={16} className="text-gray-400 ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Addresses Section */}
      {isLoggedIn && showAddresses && (
        <div ref={addressesSectionRef} className="px-4 mt-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Saved Addresses</h2>
            <button
              onClick={() => setShowAddresses(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 min-h-[100px] flex flex-col justify-center">
            {loadingAddresses && (
              <p className="text-center text-gray-400">Loading addresses...</p>
            )}
            {addressError && (
              <p className="text-center text-red-400">{addressError}</p>
            )}
            {!loadingAddresses && !addressError && addresses.length === 0 && (
              <div className="flex flex-col items-center justify-center">
                <MapPin size={48} className="text-gray-500 mb-4" />
                <p className="text-gray-400 text-center">
                  You have no saved addresses.
                </p>
                <button
                  onClick={() => navigate("/location")}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Add Address
                </button>
              </div>
            )}
            {!loadingAddresses && !addressError && addresses.length > 0 && (
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="bg-gray-700 p-4 rounded-xl shadow-md"
                  >
                    <h3 className="text-lg font-semibold mb-1">
                      {addr.billing_customer_name}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {addr.billing_address}{" "}
                      {addr.billing_address_2
                        ? `${addr.billing_address_2},`
                        : ""}
                      <br />
                      {addr.billing_city}, {addr.billing_state},{" "}
                      {addr.billing_pincode}
                    </p>
                  </div>
                ))}
                <button
                  onClick={() => navigate("/location")}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Add New Address
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold">Terms and Conditions</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-6 space-y-6">
              <p className="text-gray-300 leading-relaxed text-sm">
                Welcome to Casa. By accessing or using our website and services,
                you agree to comply with and be bound by these Terms and
                Conditions. Please read them carefully before making any
                purchase. These Terms govern your use of the website, and by
                placing an order you confirm that you are at least 18 years old
                and capable of entering into legally binding agreements. We
                reserve the right to update, modify, or discontinue any part of
                the website at any time without prior notice.
              </p>
              <p className="text-gray-300 leading-relaxed text-sm">
                All product descriptions, pricing, and availability displayed on
                the website are subject to change without notice. While we make
                every effort to ensure accuracy, errors may occur, and in such
                cases we reserve the right to cancel or refuse any order. Orders
                are subject to acceptance and availability. Payment must be made
                through the secure gateways provided on our website, and we
                shall not be liable for any delays caused by third-party payment
                providers.
              </p>
              <p className="text-gray-300 leading-relaxed text-sm">
                Shipping and delivery times are estimates and not guaranteed,
                and we are not responsible for delays beyond our control such as
                courier disruptions or natural disasters. The risk of loss
                passes to you upon delivery. Returns and refunds are accepted
                only as per our Return and Refund Policy, and products must be
                unused, in original condition, and returned within the specified
                period. Refunds will be made to the original payment method.
              </p>
              <p className="text-gray-300 leading-relaxed text-sm">
                All content, including images, designs, and trademarks, are
                owned by Casa or licensed to us, and you may not reproduce or
                exploit any content without our written consent. You agree to
                use the website only for lawful purposes and are responsible for
                maintaining the confidentiality of your account details.
              </p>
              <p className="text-gray-300 leading-relaxed text-sm">
                To maximum extent permitted by law, we shall not be liable for
                any indirect, incidental, or consequential damages arising from
                your use of our website or products. Our liability is limited to
                the value of the product purchased. These Terms are governed by
                the laws of Maharashtra, and any disputes will be subject to the
                exclusive jurisdiction of the courts in Maharashtra.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Login Popup */}
      <LoginPopup
        isOpen={isLoginPopupOpen}
        onClose={handleLoginClose}
        onContinue={handleLoginContinue}
      />
    </div>
  );
};

export default ProfilePage;
