import {useEffect} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {authStorage} from "@/utils/storage";
import {Loader2} from "lucide-react";

/**
 * OAuth Callback Handler
 * Processes OAuth redirects from Google/GitHub
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {setUserData} = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get("token");
      const provider = searchParams.get("provider");
      const error = searchParams.get("error");

      // Handle errors
      if (error) {
        console.error("OAuth error:", error);
        navigate("/login", {
          state: {
            error: `Authentication failed. Please try again.`,
          },
        });
        return;
      }

      // Handle successful OAuth
      if (token) {
        try {
          // Fetch user data
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const user = data.user || data;
            authStorage.setToken(token);
            authStorage.setUser(user);
            setUserData(user);

            const savedFrom = sessionStorage.getItem("auth_redirect_after_login");
            if (savedFrom) {
              sessionStorage.removeItem("auth_redirect_after_login");
              navigate(savedFrom, { replace: true });
            } else {
              navigate("/dashboard", { replace: true });
            }
          } else {
            throw new Error("Failed to fetch user data");
          }
        } catch (err) {
          console.error("OAuth callback error:", err);
          navigate("/login", {
            state: {
              error: "Authentication failed. Please try again.",
            },
          });
        }
      } else {
        // No token, redirect to login
        navigate("/login");
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setUserData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white mb-2">
          Completing Sign In...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we set up your account
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
