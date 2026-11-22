import { Navigate, useLocation } from "react-router-dom";
import { useTPO } from "@/context/TPOContext";
import { AlertCircle } from "lucide-react";
import { isCampusSuspended } from "@/utils/campusStatus";

const TPOProtectedRoute = ({ children }) => {
  const { tpoUser, institution, loading } = useTPO();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Loading TPO portal...</p>
        </div>
      </div>
    );
  }

  if (!tpoUser || tpoUser.role !== "tpo") {
    return <Navigate to="/tpo/login" state={{ from: location }} replace />;
  }

  if (isCampusSuspended(institution?.status)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4">
        <div className="max-w-md w-full p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Campus access unavailable
          </h1>
          <p className="text-sm text-zinc-500">
            This campus is suspended. Contact SmartNShine
            support for assistance.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default TPOProtectedRoute;
