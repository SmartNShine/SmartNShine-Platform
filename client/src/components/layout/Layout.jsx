import {Outlet, useLocation} from "react-router-dom";
import {useState, useEffect, useCallback} from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {PageTransition, FestiveSaleBanner} from "@/components/common";
import {getPricing} from "@/api/subscription.api";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smartnshine_sidebar_open");
      if (saved !== null) {
        return saved === "true";
      }
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [isFocusMode, setIsFocusMode] = useState(false);
  const location = useLocation();
  const [promotion, setPromotion] = useState(null);

  const handleSetSidebarOpen = useCallback((value) => {
    setIsSidebarOpen((prev) => {
      const next = typeof value === "boolean" ? value : !prev;
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        localStorage.setItem("smartnshine_sidebar_open", String(next));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchPromo = async () => {
      try {
        const data = await getPricing();
        if (isMounted) {
          setPromotion(data?.promotion || null);
        }
      } catch (err) {
        console.error("Failed to load promotion in Layout:", err);
      }
    };
    fetchPromo();
    return () => {
      isMounted = false;
    };
  }, []);

  // Responsive sidebar handling with desktop persistence
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        const saved = localStorage.getItem("smartnshine_sidebar_open");
        if (saved !== null) {
          setIsSidebarOpen(saved === "true");
        } else {
          setIsSidebarOpen(true);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isWorkspace = [
    "/dashboard",
    "/my-resumes",
    "/ats-analyzer",
    "/upload",
    "/github-import",
    "/career-profile",
    "/career-qa",
    "/portfolio",
    "/interview",
    "/editor",
    "/profile",
    "/subscription",
    "/payment",
  ].some((route) => location.pathname.startsWith(route));

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#09090b]">
      {/* Sidebar - Suppressed in Fullscreen Focus Mode */}
      {!isFocusMode && (
        <Sidebar isOpen={isSidebarOpen} setIsOpen={handleSetSidebarOpen} />
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isFocusMode
            ? "ml-0"
            : isSidebarOpen
            ? "lg:ml-64"
            : "lg:ml-20"
        }`}
      >
        {/* Fixed Top Navbar - Suppressed in Fullscreen Focus Mode */}
        {!isFocusMode && (
          <Navbar
            toggleSidebar={() => handleSetSidebarOpen()}
            isSidebarOpen={isSidebarOpen}
            promotion={promotion}
          />
        )}

        {/* Page Content: Starts below Navbar unless in full-screen Focus Mode */}
        <main
          className={`flex-1 w-full bg-[#f8fafc] dark:bg-[#09090b] ${
            isFocusMode ? "pt-0" : "pt-14 lg:pt-16"
          }`}
        >
          {promotion && promotion.enabled && !isWorkspace && !isFocusMode && (
            <FestiveSaleBanner promotion={promotion} />
          )}

          <PageTransition key={location.pathname}>
            <Outlet context={{ isFocusMode, setIsFocusMode }} />
          </PageTransition>
        </main>

        {/* Footer (Hidden on dashboard, workspace pages, and focus mode) */}
        {!isWorkspace && !isFocusMode && <Footer />}
      </div>
    </div>
  );
};

export default Layout;
