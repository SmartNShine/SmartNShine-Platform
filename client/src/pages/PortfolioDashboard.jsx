import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import SEO from "@/components/common/SEO";
import { Plus, Globe2, ArrowLeft } from "lucide-react";
import { portfolioAPI } from "@/api/portfolio.api";
import PortfolioBanner from "@/components/portfolio/PortfolioBanner";
import PortfolioCard from "@/components/portfolio/PortfolioCard";
import EmptyPortfolioState from "@/components/portfolio/EmptyPortfolioState";

const getPublicUrl = (slug) => `${window.location.origin}/u/${slug}`;

export default function PortfolioDashboard() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.list();
      setPortfolios(response.data.portfolios || []);
    } catch (error) {
      toast.error("Failed to load portfolios");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (slug) => {
    await navigator.clipboard.writeText(getPublicUrl(slug));
    toast.success("Portfolio link copied to clipboard!");
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this portfolio?")) return;

    try {
      await portfolioAPI.delete(id);
      setPortfolios((items) => items.filter((item) => item._id !== id));
      toast.success("Portfolio deleted successfully");
    } catch (error) {
      toast.error("Failed to delete portfolio");
      console.error(error);
    }
  };

  // Compute aggregate stats
  const totalViews = portfolios.reduce((acc, p) => acc + (p.analytics?.totalViews || 0), 0);
  const totalResumeDownloads = portfolios.reduce((acc, p) => acc + (p.analytics?.resumeDownloads || 0), 0);
  const totalProjectClicks = portfolios.reduce((acc, p) => acc + (p.analytics?.projectClicks || 0), 0);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-3 border-gray-200 dark:border-zinc-800 border-t-emerald-600 dark:border-t-emerald-500 rounded-full animate-spin"></div>
            <Globe2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold tracking-wide uppercase">
            Loading Portfolios...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <SEO
        title="Developer Portfolios | SmartNShine"
        description="Manage, customize, and publish your personalized developer portfolio websites. View live traffic metrics and resume engagement."
        noindex={true}
      />

      {/* Main Container */}
      <main className="flex-1 workspace-container py-8 space-y-6">
        {/* Back to Dashboard Breadcrumb */}
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Banner & Stats */}
        <PortfolioBanner
          portfoliosCount={portfolios.length}
          totalViews={totalViews}
          totalResumeDownloads={totalResumeDownloads}
          totalProjectClicks={totalProjectClicks}
        />

        {/* Content Section */}
        {portfolios.length === 0 ? (
          <EmptyPortfolioState />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Your Published Websites ({portfolios.length})
              </h2>
              <Link
                to="/portfolio/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Portfolio</span>
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {portfolios.map((portfolio) => (
                <PortfolioCard
                  key={portfolio._id}
                  portfolio={portfolio}
                  onCopy={handleCopy}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
