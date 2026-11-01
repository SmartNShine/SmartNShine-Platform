import {useState, useEffect} from "react";
import {useNavigate, useLocation, Link} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {parseValidationErrors} from "@/utils/errorHandler";
import {useToggle} from "@/hooks";
import {loginSchema, validateWithSchema} from "@/utils/validation";
import {config} from "@/utils/constants";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Github,
  Sparkles,
} from "lucide-react";
import {FcGoogle} from "react-icons/fc";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, toggleShowPassword] = useToggle(false);
  const [error, setError] = useState("");
  const [loading, toggleLoading, setLoadingTrue, setLoadingFalse] =
    useToggle(false);
  const {login, user, loading: authLoading} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", {replace: true});
    }
  }, [user, authLoading, navigate]);

  const handleOAuthClick = () => {
    if (location.state?.from?.pathname) {
      try {
        sessionStorage.setItem(
          "auth_redirect_after_login",
          location.state.from.pathname
        );
      } catch {
        // Fallback silently if storage unavailable
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate with Yup
    const {isValid, errors} = await validateWithSchema(loginSchema, {
      email,
      password,
    });

    if (!isValid) {
      setError(Object.values(errors)[0]); // Show first error
      return;
    }

    setLoadingTrue();

    try {
      await login(email, password);
      const fromPath = location.state?.from?.pathname || "/dashboard";
      const fromState = location.state?.from?.state;
      navigate(fromPath, {replace: true, state: fromState});
    } catch (err) {
      if (
        err.response?.status === 429 ||
        err.response?.data?.type === "AUTH_RATE_LIMIT_EXCEEDED"
      ) {
        navigate("/rate-limit-exceeded", {
          state: {
            errorDetails: {
              message:
                err.response?.data?.error ||
                "Too many authentication attempts. Please try again after 15 minutes.",
              retryAfter: err.response?.data?.retryAfter || "15 minutes",
            },
          },
        });
      } else {
        setError(parseValidationErrors(err));
      }
    } finally {
      setLoadingFalse();
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sign in to your SmartNShine workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
          {/* Switcher Tabs */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-zinc-900 p-1 mb-6">
            <button
              type="button"
              className="flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs cursor-default"
            >
              Sign In
            </button>
            <Link
              to="/register"
              state={location.state}
              className="flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white text-center transition-colors"
            >
              Create Account
            </Link>
          </div>

          {/* Auth Required Message */}
          {location.state?.from && (
            <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                Please sign in or create an account to access this feature.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-900 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* 1-CLICK OAUTH BUTTONS (High priority at top) */}
          <div className="space-y-2.5 mb-6">
            <a
              href={`${config.serverUrl}/api/auth/google?origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`}
              onClick={handleOAuthClick}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 font-semibold text-gray-800 dark:text-gray-200 text-sm shadow-xs active:scale-98"
            >
              <FcGoogle className="w-5 h-5 shrink-0" />
              <span>Continue with Google</span>
            </a>

            <a
              href={`${config.serverUrl}/api/auth/github?origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`}
              onClick={handleOAuthClick}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-xl transition-all duration-200 font-medium text-gray-700 dark:text-gray-300 text-sm active:scale-98"
            >
              <Github className="w-4 h-4 shrink-0" />
              <span>Continue with GitHub</span>
            </a>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="px-3 bg-white dark:bg-zinc-950 text-gray-400 font-medium">
                Or sign in with email
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-black border border-gray-300 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all text-sm"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-2.5 bg-white dark:bg-black border border-gray-300 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all text-sm"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold rounded-xl transition-all shadow-md active:scale-98 text-sm mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-black stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Divider to Sign up */}
          <div className="mt-6 pt-5 border-t border-gray-200 dark:border-zinc-800/80 text-center">
            <p className="text-xs text-gray-600 dark:text-zinc-400">
              Don&apos;t have an account yet?{" "}
              <Link
                to="/register"
                state={location.state}
                className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Create a free account →
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <p className="mt-6 text-center text-xs text-gray-500 dark:text-zinc-500">
          By signing in, you agree to our{" "}
          <Link
            to="/terms-and-conditions"
            className="text-amber-600 dark:text-amber-400 hover:underline"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy-policy"
            className="text-amber-600 dark:text-amber-400 hover:underline"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
