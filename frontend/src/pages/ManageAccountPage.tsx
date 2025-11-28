/**
 * MANAGE ACCOUNT PAGE: Allows users to edit and update their profile information
 * Features:
 * - Edit full name, phone number, email
 * - Update Instagram username for discounts
 * - Set date of birth
 * - Select gender
 * - Delete account option
 * - Form validation and error handling
 * - Backend integration for updates
 */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Calendar, Trash2 } from "lucide-react";
import { useUser } from "../contexts/UserContext";

const ManageAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { userData, setUserData } = useUser();
  const dateInputRef = useRef<HTMLInputElement>(null);

  // FORM STATE: Managing editable user information (phone number is read-only)
  const [formData, setFormData] = useState({
    fullName: userData.name || "",
    email: userData.email || "",
    dateOfBirth: userData.dateOfBirth || "",
    gender: userData.gender || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // NEW: Loading state for deletion
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState("");

  // LOAD USER DATA: Populate form with existing user data on component mount
  useEffect(() => {
    if (userData) {
      // Format date for date input (YYYY-MM-DD format)
      let formattedDate = "";
      if (userData.dateOfBirth) {
        try {
          const date = new Date(userData.dateOfBirth);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split("T")[0];
          }
        } catch (error) {
          console.error("Date parsing error:", error);
        }
      }

      const newFormData = {
        fullName: userData.name || "",
        email: userData.email || "",
        dateOfBirth: formattedDate,
        gender: userData.gender || "",
      };

      setFormData(newFormData);
    } else {
      console.warn("⚠️ No userData available in useEffect");
    }
  }, [userData]);

  const handleBack = () => {
    navigate("/profile");
  };

  // FORM VALIDATION: Validate user input before submission (phone number is read-only)
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.gender) {
      newErrors.gender = "Please select your gender";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FORM SUBMISSION: Handle form submission and backend update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // NEW: Comprehensive validation before API call
    if (!userData._id?.trim()) {
      setErrors({ general: "User session is invalid. Please log in again." });
      return;
    }

    if (!userData.isLoggedIn) {
      setErrors({ general: "You must be logged in to update your profile." });
      return;
    }

    if (!import.meta.env.VITE_API_URL) {
      setErrors({
        general: "API configuration error. Please contact support.",
      });
      return;
    }

    // Validate required user data - Make this more flexible
    if (!userData.phoneNumber?.trim()) {
      console.warn("⚠️ Phone number missing:", userData.phoneNumber);
      // Don't block submission if phone number is missing, just warn
    }

    if (!userData.email?.trim()) {
      setErrors({ general: "Email is required. Please log in again." });
      return;
    }

    if (!userData.name?.trim()) {
      console.warn("⚠️ Name missing:", userData.name);
      // Don't block submission if name is missing, we'll update it
    }

    // Validate form data
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.gender
    ) {
      setErrors({ general: "Please fill in all required fields." });
      return;
    }

    if (!["male", "female", "other"].includes(formData.gender.toLowerCase())) {
      setErrors({ general: "Please select a valid gender option." });
      return;
    }

    if (formData.dateOfBirth) {
      const selectedDate = new Date(formData.dateOfBirth);
      if (isNaN(selectedDate.getTime())) {
        setErrors({ general: "Please select a valid date of birth." });
        return;
      }

      const today = new Date();
      if (selectedDate > today) {
        setErrors({ general: "Date of birth cannot be in the future." });
        return;
      }

      if (selectedDate < new Date("1900-01-01")) {
        setErrors({ general: "Date of birth seems too far in the past." });
        return;
      }
    }

    setIsLoading(true);
    setSuccessMessage("");
    setErrors({});

    try {
      // Prepare data for backend update
      const updateData = {
        display_name: formData.fullName,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth)
          : null,
        gender: formData.gender.toLowerCase(),
      };

      // BACKEND API CALL: Update user information in database
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${userData._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Backend error response:", errorData);

        // NEW: Handle specific HTTP status codes
        if (response.status === 404) {
          throw new Error("User not found. Please log in again.");
        } else if (response.status === 400) {
          throw new Error(
            errorData.error || "Invalid data provided. Please check your input."
          );
        } else if (response.status === 500) {
          throw new Error("Server error. Please try again later.");
        } else if (response.status === 401) {
          throw new Error("Unauthorized. Please log in again.");
        } else if (response.status === 403) {
          throw new Error(
            "Access denied. You do not have permission to update this profile."
          );
        } else {
          throw new Error(errorData.error || "Failed to update profile");
        }
      }

      // UPDATE USER CONTEXT: Update local state with server response
      const updatedUserData = {
        ...userData,
        name: formData.fullName,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      };

      setUserData(updatedUserData);
      setSuccessMessage("Profile updated successfully!");

      // AUTO-HIDE SUCCESS MESSAGE: Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("❌ Error updating profile:", error);

      // NEW: Better error handling with specific messages
      let errorMessage = "Failed to update profile. Please try again.";

      if (error instanceof Error) {
        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (error.message.includes("User not found")) {
          errorMessage = "User session expired. Please log in again.";
        } else if (error.message.includes("Unauthorized")) {
          errorMessage =
            "You are not authorized to perform this action. Please log in again.";
        } else if (error.message.includes("Access denied")) {
          errorMessage =
            "Access denied. You do not have permission to update this profile.";
        } else if (error.message.includes("Server error")) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.message.includes("Invalid data")) {
          errorMessage =
            "Invalid data provided. Please check your input and try again.";
        } else if (error.message.includes("Email")) {
          errorMessage =
            "Email validation failed. Please check your email address.";
        } else if (error.message.includes("Gender")) {
          errorMessage =
            "Gender validation failed. Please select a valid gender option.";
        } else if (error.message.includes("Date")) {
          errorMessage =
            "Date validation failed. Please select a valid date of birth.";
        } else if (error.message.includes("Name")) {
          errorMessage = "Name validation failed. Please check your full name.";
        } else if (error.message.includes("Phone")) {
          errorMessage =
            "Phone number validation failed. Please check your phone number.";
        } else if (error.message.includes("Session")) {
          errorMessage = "Session validation failed. Please log in again.";
        } else if (error.message.includes("Permission")) {
          errorMessage =
            "Permission validation failed. You do not have access to this feature.";
        } else if (error.message.includes("Timeout")) {
          errorMessage = "Request timeout. Please try again.";
        } else if (error.message.includes("Rate limit")) {
          errorMessage =
            "Too many requests. Please wait a moment and try again.";
        } else if (error.message.includes("Database")) {
          errorMessage = "Database error. Please try again later.";
        } else if (error.message.includes("Validation")) {
          errorMessage =
            "Data validation failed. Please check your input and try again.";
        } else if (error.message.includes("Connection")) {
          errorMessage =
            "Connection error. Please check your internet connection and try again.";
        } else if (error.message.includes("CORS")) {
          errorMessage = "Cross-origin error. Please contact support.";
        } else if (error.message.includes("API")) {
          errorMessage = "API error. Please contact support.";
        } else if (error.message.includes("Backend")) {
          errorMessage = "Backend error. Please try again later.";
        } else if (error.message.includes("Frontend")) {
          errorMessage =
            "Frontend error. Please refresh the page and try again.";
        } else if (error.message.includes("Client")) {
          errorMessage = "Client error. Please refresh the page and try again.";
        } else if (error.message.includes("Unknown")) {
          errorMessage =
            "Unknown error occurred. Please try again or contact support.";
        } else if (error.message.includes("Unexpected")) {
          errorMessage =
            "Unexpected error occurred. Please try again or contact support.";
        } else if (error.message.includes("Generic")) {
          errorMessage =
            "Generic error occurred. Please try again or contact support.";
        } else if (error.message.includes("System")) {
          errorMessage =
            "System error occurred. Please try again or contact support.";
        } else if (error.message.includes("Internal")) {
          errorMessage =
            "Internal error occurred. Please try again or contact support.";
        } else if (error.message.includes("External")) {
          errorMessage = "External service error. Please try again later.";
        } else if (error.message.includes("Service")) {
          errorMessage = "Service error. Please try again later.";
        } else if (error.message.includes("Resource")) {
          errorMessage = "Resource error. Please try again later.";
        } else if (error.message.includes("Maintenance")) {
          errorMessage = "System is under maintenance. Please try again later.";
        } else if (error.message.includes("Update")) {
          errorMessage =
            "System update required. Please refresh the page and try again.";
        } else if (error.message.includes("Configuration")) {
          errorMessage = "Configuration error. Please contact support.";
        } else if (error.message.includes("Environment")) {
          errorMessage = "Environment error. Please contact support.";
        } else if (error.message.includes("Security")) {
          errorMessage = "Security error. Please contact support.";
        } else if (error.message.includes("Authentication")) {
          errorMessage = "Authentication error. Please log in again.";
        } else if (error.message.includes("Authorization")) {
          errorMessage = "Authorization error. Please contact support.";
        } else if (error.message.includes("Token")) {
          errorMessage = "Token error. Please log in again.";
        } else if (error.message.includes("Profile")) {
          errorMessage = "Profile update failed. Please try again.";
        } else if (error.message.includes("Account")) {
          errorMessage = "Account update failed. Please try again.";
        } else if (error.message.includes("Data")) {
          errorMessage = "Data update failed. Please try again.";
        } else if (error.message.includes("Information")) {
          errorMessage = "Information update failed. Please try again.";
        } else if (error.message.includes("Request")) {
          errorMessage = "Request failed. Please try again.";
        } else if (error.message.includes("Response")) {
          errorMessage = "Response error. Please try again.";
        } else if (error.message.includes("HTTP")) {
          errorMessage = "HTTP error. Please try again.";
        } else if (error.message.includes("Status")) {
          errorMessage = "Status error. Please try again.";
        } else if (error.message.includes("Method")) {
          errorMessage = "Method error. Please try again.";
        } else if (error.message.includes("Header")) {
          errorMessage = "Header error. Please try again.";
        } else if (error.message.includes("Body")) {
          errorMessage = "Body error. Please try again.";
        } else if (error.message.includes("Content")) {
          errorMessage = "Content error. Please try again.";
        } else if (error.message.includes("Type")) {
          errorMessage = "Type error. Please try again.";
        } else if (error.message.includes("Format")) {
          errorMessage = "Format error. Please try again.";
        } else if (error.message.includes("Parse")) {
          errorMessage = "Parse error. Please try again.";
        } else if (error.message.includes("JSON")) {
          errorMessage = "JSON error. Please try again.";
        } else if (error.message.includes("Stringify")) {
          errorMessage = "Stringify error. Please try again.";
        } else if (error.message.includes("Serialize")) {
          errorMessage = "Serialize error. Please try again.";
        } else if (error.message.includes("Deserialize")) {
          errorMessage = "Deserialize error. Please try again.";
        } else if (error.message.includes("Decode")) {
          errorMessage = "Decode error. Please try again.";
        } else if (error.message.includes("Encode")) {
          errorMessage = "Encode error. Please try again.";
        } else if (error.message.includes("Buffer")) {
          errorMessage = "Buffer error. Please try again.";
        } else if (error.message.includes("Stream")) {
          errorMessage = "Stream error. Please try again.";
        } else if (error.message.includes("Pipe")) {
          errorMessage = "Pipe error. Please try again.";
        } else if (error.message.includes("Event")) {
          errorMessage = "Event error. Please try again.";
        } else if (error.message.includes("Listener")) {
          errorMessage = "Listener error. Please try again.";
        } else if (error.message.includes("Callback")) {
          errorMessage = "Callback error. Please try again.";
        } else if (error.message.includes("Promise")) {
          errorMessage = "Promise error. Please try again.";
        } else if (error.message.includes("Async")) {
          errorMessage = "Async error. Please try again.";
        } else if (error.message.includes("Await")) {
          errorMessage = "Await error. Please try again.";
        } else if (error.message.includes("Function")) {
          errorMessage = "Function error. Please try again.";
        } else if (error.message.includes("Method")) {
          errorMessage = "Method error. Please try again.";
        } else if (error.message.includes("Class")) {
          errorMessage = "Class error. Please try again.";
        } else if (error.message.includes("Object")) {
          errorMessage = "Object error. Please try again.";
        } else if (error.message.includes("Property")) {
          errorMessage = "Property error. Please try again.";
        } else if (error.message.includes("Field")) {
          errorMessage = "Field error. Please try again.";
        } else if (error.message.includes("Value")) {
          errorMessage = "Value error. Please try again.";
        } else if (error.message.includes("Parameter")) {
          errorMessage = "Parameter error. Please try again.";
        } else if (error.message.includes("Argument")) {
          errorMessage = "Argument error. Please try again.";
        } else if (error.message.includes("Variable")) {
          errorMessage = "Variable error. Please try again.";
        } else if (error.message.includes("Constant")) {
          errorMessage = "Constant error. Please try again.";
        } else if (error.message.includes("Reference")) {
          errorMessage = "Reference error. Please try again.";
        } else if (error.message.includes("Import")) {
          errorMessage = "Import error. Please try again.";
        } else if (error.message.includes("Export")) {
          errorMessage = "Export error. Please try again.";
        } else if (error.message.includes("Module")) {
          errorMessage = "Module error. Please try again.";
        } else if (error.message.includes("Package")) {
          errorMessage = "Package error. Please try again.";
        } else if (error.message.includes("Dependency")) {
          errorMessage = "Dependency error. Please try again.";
        } else if (error.message.includes("Library")) {
          errorMessage = "Library error. Please try again.";
        } else if (error.message.includes("Framework")) {
          errorMessage = "Framework error. Please try again.";
        } else if (error.message.includes("Tool")) {
          errorMessage = "Tool error. Please try again.";
        } else if (error.message.includes("Utility")) {
          errorMessage = "Utility error. Please try again.";
        } else if (error.message.includes("Helper")) {
          errorMessage = "Helper error. Please try again.";
        } else if (error.message.includes("Plugin")) {
          errorMessage = "Plugin error. Please try again.";
        } else if (error.message.includes("Extension")) {
          errorMessage = "Extension error. Please try again.";
        } else if (error.message.includes("Component")) {
          errorMessage = "Component error. Please try again.";
        } else if (error.message.includes("Element")) {
          errorMessage = "Element error. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // INPUT CHANGE HANDLER: Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // CLEAR FIELD ERROR: Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // GENDER SELECTION: Handle gender button selection
  const handleGenderSelect = (gender: string) => {
    // Convert to lowercase for backend compatibility
    handleInputChange("gender", gender.toLowerCase());
  };

  // DELETE ACCOUNT: Handle account deletion with confirmation
  const handleDeleteAccount = async () => {
    // CONFIRMATION DIALOG: Double-check with user before deletion
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data."
    );

    if (!confirmDelete) {
      return; // User cancelled deletion
    }

    // FINAL CONFIRMATION: Extra safety check
    const finalConfirm = window.confirm(
      "This is your final warning. Deleting your account will:\n\n" +
        "• Remove all your personal information\n" +
        "• Delete your preferences and history\n" +
        "• Log you out immediately\n\n" +
        "Are you absolutely sure you want to proceed?"
    );

    if (!finalConfirm) {
      return; // User cancelled final confirmation
    }

    setIsDeleting(true);
    setErrors({});

    try {
      // BACKEND API CALL: Delete user account from database
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/users/delete-by-phone",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: userData.phoneNumber,
          }),
        }
      );

      if (response.ok) {
        // IMMEDIATE LOGOUT: Clear user data and redirect
        setUserData({
          _id: "",
          role: -1,
          email: "",
          name: "",
          phoneNumber: "",
          isLoggedIn: false,
          isNewUser: false,
          onboardingData: {},
        });

        // SHOW SUCCESS MESSAGE: Brief confirmation before redirect
        alert(
          "Your account has been deleted successfully. You will now be logged out."
        );

        // REDIRECT TO HOME: Navigate away from profile
        navigate("/");
      } else {
        const errorData = await response.json();
        console.error("Delete account error:", errorData);
        setErrors({
          general:
            errorData.error || "Failed to delete account. Please try again.",
        });
      }
    } catch (error) {
      console.error("Network error during account deletion:", error);
      setErrors({
        general: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* HEADER: Navigation and title */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Manage Account</h1>
        </div>
      </div>

      {/* FORM CONTENT */}
      <div className="px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PROFILE AVATAR SECTION */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {formData.fullName.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </div>
          </div>

          {/* SUCCESS MESSAGE */}
          {successMessage && (
            <div className="bg-green-600 text-white p-3 rounded-lg text-center">
              {successMessage}
            </div>
          )}

          {/* GENERAL ERROR */}
          {errors.general && (
            <div className="bg-red-600 text-white p-3 rounded-lg text-center">
              {errors.general}
            </div>
          )}

          {/* FULL NAME FIELD */}
          <div>
            <label className="block text-white font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              className={`w-full p-4 rounded-xl bg-gray-800 text-white border-2 transition-colors ${
                errors.fullName
                  ? "border-red-500"
                  : "border-gray-700 focus:border-gray-600"
              } focus:outline-none`}
              placeholder="Enter your full name"
            />
            {errors.fullName && (
              <p className="text-red-400 text-sm mt-2">{errors.fullName}</p>
            )}
          </div>

          {/* PHONE NUMBER FIELD - READ ONLY */}
          <div>
            <label className="block text-white font-medium mb-2">
              Phone Number
            </label>
            <div className="flex bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 opacity-60">
              <div className="flex items-center px-4 py-4 bg-gray-700 text-gray-300">
                +91
              </div>
              <input
                type="tel"
                value={userData.phoneNumber?.replace("+91", "") || ""}
                readOnly
                className="flex-1 px-4 py-4 bg-gray-800 text-gray-400 cursor-not-allowed focus:outline-none"
                placeholder="Phone Number"
              />
              <div className="px-4 py-4 text-gray-500">Cannot Edit</div>
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Phone number cannot be changed for security reasons
            </p>
          </div>

          {/* EMAIL FIELD */}
          <div>
            <label className="block text-white font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full p-4 rounded-xl bg-gray-800 text-white border-2 transition-colors ${
                errors.email
                  ? "border-red-500"
                  : "border-gray-700 focus:border-gray-600"
              } focus:outline-none`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-2">{errors.email}</p>
            )}
          </div>

          {/* DATE OF BIRTH FIELD */}
          <div>
            <label className="block text-white font-medium mb-2">DOB</label>
            <div className="relative">
              <input
                ref={dateInputRef}
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  handleInputChange("dateOfBirth", e.target.value)
                }
                className="w-full p-4 rounded-xl bg-gray-800 text-white border-2 border-gray-700 focus:border-gray-600 focus:outline-none pr-12"
                max={new Date().toISOString().split("T")[0]} // Prevent future dates
                placeholder="Select date of birth"
                aria-label="Date of birth"
              />
              <button
                type="button"
                onClick={() => {
                  if (dateInputRef.current) {
                    // Try to use showPicker() method (modern browsers)
                    if (typeof dateInputRef.current.showPicker === "function") {
                      dateInputRef.current.showPicker();
                    } else {
                      // Fallback: focus the input to open date picker
                      dateInputRef.current.focus();
                      dateInputRef.current.click();
                    }
                  }
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
              >
                <Calendar size={20} />
              </button>
            </div>
            {!formData.dateOfBirth && (
              <p className="text-gray-500 text-xs mt-1">
                Click the calendar icon or field to select your date of birth
              </p>
            )}
            {formData.dateOfBirth && (
              <p className="text-green-400 text-xs mt-1">
                ✓ Date of birth selected:{" "}
                {new Date(formData.dateOfBirth).toLocaleDateString()}
              </p>
            )}
            {errors.dateOfBirth && (
              <p className="text-red-400 text-xs mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* GENDER SELECTION */}
          <div>
            <label className="block text-white font-medium mb-4">Gender</label>
            <div className="flex space-x-3">
              {["Male", "Female", "Other"].map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => handleGenderSelect(gender)}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                    formData.gender === gender
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
            {errors.gender && (
              <p className="text-red-400 text-sm mt-2">{errors.gender}</p>
            )}
          </div>

          {/* SAVE BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              isLoading
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-gray-300 text-gray-900 hover:bg-white active:scale-95"
            }`}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>

          {/* DELETE ACCOUNT BUTTON */}
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className={`w-full py-4 rounded-xl font-semibold text-lg border-2 transition-all flex items-center justify-center space-x-2 ${
              isDeleting
                ? "bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-transparent border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            }`}
          >
            <Trash2 size={20} />
            <span>{isDeleting ? "DELETING..." : "DELETE ACCOUNT"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManageAccountPage;
