import {useState, useEffect, useCallback} from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const MainLayout = ({children}) => {
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

  const handleSetSidebarOpen = useCallback((value) => {
    setIsSidebarOpen((prev) => {
      const next = typeof value === "boolean" ? value : !prev;
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        localStorage.setItem("smartnshine_sidebar_open", String(next));
      }
      return next;
    });
  }, []);

  // Auto-open sidebar on desktop with persistence
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={handleSetSidebarOpen} />

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Top Navbar */}
        <Navbar toggleSidebar={() => handleSetSidebarOpen()} isSidebarOpen={isSidebarOpen} />

        {/* Page Content */}
        <main className="pt-16">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
