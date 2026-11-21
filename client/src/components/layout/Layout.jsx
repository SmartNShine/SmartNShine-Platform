import {Outlet, useLocation} from "react-router-dom";
import {useState, useEffect} from "react";
import {useToggle} from "@/hooks";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {PageTransition, FestiveSaleBanner} from "@/components/common";
import {getPricing} from "@/api/subscription.api";

const Layout = () => {
  const [
    isSidebarOpen,
    toggleSidebar,
    setIsSidebarOpenTrue,
    setIsSidebarOpenFalse,
  ] = useToggle(false);
  const location = useLocation();
  const [promotion, setPromotion] = useState(null);

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


  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpenTrue();
      } else {
        setIsSidebarOpenFalse();
      }
    };

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsSidebarOpenTrue, setIsSidebarOpenFalse]);

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

  // Main dashboard still gets the global footer (e.g. company LinkedIn); other workspace routes stay chrome-only.
  const showGlobalFooter = !isWorkspace || location.pathname === "/dashboard";

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#09090b]">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={toggleSidebar} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-72" : "lg:ml-28"
        }`}
      >
        {/* Fixed Top Navbar */}
        <Navbar
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Page Content: Starts below Navbar (pt-14 or pt-16) */}
        <main className="flex-1 pt-14 lg:pt-16 w-full bg-[#f8fafc] dark:bg-[#09090b]">
          {promotion && promotion.enabled && !isWorkspace && (
            <FestiveSaleBanner promotion={promotion} />
          )}

          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>

        {/* Footer (Hidden on workspace pages except the main /dashboard hub) */}
        {showGlobalFooter && <Footer />}
      </div>
    </div>
  );
};

export default Layout;
