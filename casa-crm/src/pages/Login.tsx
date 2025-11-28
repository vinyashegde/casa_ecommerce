import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Sparkles, Zap } from "lucide-react";
import { useBrand } from "../contexts/BrandContext";

const Login = () => {
  const navigate = useNavigate();
  const { loginBrand, checkOnboardingStatus } = useBrand();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("support@dillusion.com");
  const [password, setPassword] = useState("SecureP@ssw0rd");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const success = await loginBrand(email, password);
      if (success) {
        // Check onboarding status after successful login
        try {
          const onboardingStatus = await checkOnboardingStatus();
          if (!onboardingStatus.is_onboarded) {
            navigate("/onboarding");
          } else {
            navigate("/");
          }
        } catch (onboardingError) {
          console.error("Error checking onboarding status:", onboardingError);
          // If we can't check onboarding status, go to dashboard
          navigate("/");
        }
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6 py-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-500/20 to-cyan-500/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo/Brand */}
        <div className="text-center mb-6">
          <h1 className="text-white/70 text-4xl font-bold">
            Sign in to continue
          </h1>
        </div>

        {/* Login Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20 backdrop-blur-xl animate-slide-up">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-2xl p-4 animate-scale-in">
                <p className="text-red-300 text-sm font-medium text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white/90">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50 input-focus"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white/90">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50 input-focus"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors duration-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-300 hover:text-indigo-200 font-semibold transition-colors duration-300 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-2xl font-bold hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-2xl hover:shadow-indigo-500/25 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative flex items-center justify-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-white/60">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-indigo-300 hover:text-indigo-200 font-semibold transition-colors duration-300 hover:underline"
              >
                Sign Up Free
              </Link>
            </p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-white/40 text-sm">
                Admin Access?{" "}
                <Link
                  to="/admin/login"
                  className="text-red-300 hover:text-red-200 font-semibold transition-colors duration-300 hover:underline"
                >
                  Admin Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
