import {useState, useEffect} from "react";
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  ExternalLink,
  Calendar,
  Building2,
  Filter,
  Loader2,
  AlertCircle,
  TrendingUp,
  X,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import {useToggle} from "@/hooks";

const JobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, toggleLoading, setLoadingTrue, setLoadingFalse] =
    useToggle(false);
  const [searchParams, setSearchParams] = useState({
    query: "software developer",
    location: "in", // Default to India
    city: "", // Specific city
    category: "", // Job category
    workType: "all", // all, remote, onsite, hybrid
    jobType: "all", // all, jobs, internships
    page: 1,
  });
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [activeJobType, setActiveJobType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(3); // Load 3 pages to avoid rate limiting
  const [categories, setCategories] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [showAdvanced, toggleShowAdvanced] = useToggle(false);
  const [expandedJobs, setExpandedJobs] = useState({}); // Track which job descriptions are expanded
  const [selectedJob, setSelectedJob] = useState(null); // Track selected job for modal
  const [
    showJobModal,
    toggleJobModal,
    setShowJobModalTrue,
    setShowJobModalFalse,
  ] = useToggle(false); // Modal visibility

  // Backend API URL
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Major cities in India
  const indianCities = [
    {value: "", label: "All Cities"},
    {value: "Mumbai", label: "Mumbai"},
    {value: "Delhi", label: "Delhi"},
    {value: "Bangalore", label: "Bangalore"},
    {value: "Hyderabad", label: "Hyderabad"},
    {value: "Chennai", label: "Chennai"},
    {value: "Kolkata", label: "Kolkata"},
    {value: "Pune", label: "Pune"},
    {value: "Ahmedabad", label: "Ahmedabad"},
    {value: "Jaipur", label: "Jaipur"},
    {value: "Surat", label: "Surat"},
    {value: "Lucknow", label: "Lucknow"},
    {value: "Kanpur", label: "Kanpur"},
    {value: "Nagpur", label: "Nagpur"},
    {value: "Indore", label: "Indore"},
    {value: "Thane", label: "Thane"},
    {value: "Bhopal", label: "Bhopal"},
    {value: "Visakhapatnam", label: "Visakhapatnam"},
    {value: "Vadodara", label: "Vadodara"},
    {value: "Gurgaon", label: "Gurgaon"},
    {value: "Noida", label: "Noida"},
  ];

  // Work type options
  const workTypes = [
    {value: "all", label: "All Jobs", icon: "💼"},
    {value: "remote", label: "Remote", icon: "🏠"},
    {value: "onsite", label: "On-site", icon: "🏢"},
    {value: "hybrid", label: "Hybrid", icon: "🔄"},
  ];

  // Job type options
  const jobTypes = [
    {value: "all", label: "All Opportunities", icon: "🌟"},
    {value: "jobs", label: "Jobs", icon: "💼"},
    {value: "internships", label: "Internships", icon: "🎓"},
  ];

  // Helper function to modify search query based on job type
  const modifyQueryForJobType = (query, jobType) => {
    let searchQuery = query.trim() || "jobs";

    if (jobType === "internships") {
      // Add "internship" to the search query for better API results
      searchQuery = searchQuery.includes("intern")
        ? searchQuery
        : `${searchQuery} internship`;
    } else if (jobType === "jobs") {
      // Remove internship keywords for regular jobs
      searchQuery =
        searchQuery.replace(/\b(intern|internship|trainee)\b/gi, "").trim() ||
        "jobs";
    }

    return searchQuery;
  };

  const searchJobs = async () => {
    setLoadingTrue();
    setCurrentPage(1); // Reset to page 1 when searching

    try {
      // Modify query based on job type using helper function
      const searchQuery = modifyQueryForJobType(
        searchParams.query,
        searchParams.jobType
      );

      // Load pages sequentially with delay to avoid rate limiting
      const allJobs = [];
      let meanSalary = 0;

      for (let page = 1; page <= totalPages; page++) {
        let url = `${API_BASE_URL}/jobs/adzuna?query=${encodeURIComponent(
          searchQuery
        )}&country=${searchParams.location}&page=${page}`;

        // Add city filter if selected
        if (searchParams.city) {
          url += `&city=${encodeURIComponent(searchParams.city)}`;
        }

        // Add category filter if selected
        if (searchParams.category) {
          url += `&category=${encodeURIComponent(searchParams.category)}`;
        }

        try {
          const response = await fetch(url);
          const data = await response.json();

          if (data.results) {
            allJobs.push(...data.results);
          }

          if (page === 1) {
            meanSalary = data.mean || 0;
          }

          // Add small delay between requests to avoid rate limiting
          if (page < totalPages) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.error(`Error fetching page ${page}:`, error);
          // Continue with other pages even if one fails
        }
      }

      // Filter jobs based on work type only (job type filtering is now done at API level)
      let filteredJobs = allJobs;

      if (searchParams.workType !== "all") {
        filteredJobs = filteredJobs.filter((job) => {
          const title = job.title?.toLowerCase() || "";
          const description = job.description?.toLowerCase() || "";
          const combined = title + " " + description;

          if (searchParams.workType === "remote") {
            return (
              combined.includes("remote") ||
              combined.includes("work from home") ||
              combined.includes("wfh")
            );
          } else if (searchParams.workType === "onsite") {
            return (
              !combined.includes("remote") &&
              !combined.includes("work from home") &&
              !combined.includes("hybrid")
            );
          } else if (searchParams.workType === "hybrid") {
            return combined.includes("hybrid");
          }
          return true;
        });
      }

      setJobs(filteredJobs);
      setStats({
        count: filteredJobs.length,
        mean: meanSalary,
      });

      if (filteredJobs.length === 0) {
        toast("No jobs found. Try different keywords or work type!", {
          icon: "🔍",
          duration: 3000,
        });
      } else {
        const message = searchParams.query.trim()
          ? `Found ${filteredJobs.length} jobs in India!`
          : `Showing ${filteredJobs.length} available jobs in India!`;
        toast.success(message, {
          icon: "✨",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error(
        "Failed to fetch jobs. Please check your API credentials in .env file.",
        {
          icon: "❌",
          duration: 4000,
        }
      );
    } finally {
      setLoadingFalse();
    }
  };

  // Fetch job categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/jobs/categories?country=${searchParams.location}`
      );
      const data = await response.json();
      if (data.results) {
        setCategories(data.results);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch top companies
  const fetchTopCompanies = async () => {
    try {
      // Modify query based on job type using helper function
      const searchQuery = modifyQueryForJobType(
        searchParams.query,
        searchParams.jobType
      );

      const response = await fetch(
        `${API_BASE_URL}/jobs/top-companies?query=${encodeURIComponent(
          searchQuery
        )}&country=${searchParams.location}`
      );
      const data = await response.json();
      if (data.leaderboard) {
        setTopCompanies(data.leaderboard.slice(0, 10)); // Top 10 companies
      }
    } catch (error) {
      console.error("Error fetching top companies:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []); // Fetch categories once on mount

  // No auto-search on filter changes - user must click Search button
  // This prevents repetitive API calls when switching tabs/filters

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({...searchParams, page: 1});
    searchJobs();
    fetchTopCompanies(); // Fetch top companies when searching
  };

  // Handle company click to search jobs from that company
  const handleCompanyClick = async (companyName) => {
    // Update search params
    const newParams = {
      ...searchParams,
      query: companyName,
      page: 1,
    };
    setSearchParams(newParams);

    // Immediately trigger search with new company name
    setLoadingTrue();
    setCurrentPage(1);

    try {
      let allJobs = [];
      let meanSalary = 0;
      const pagesToFetch = 3;

      // Modify company search query based on job type using helper function
      const companySearchQuery = modifyQueryForJobType(
        companyName,
        newParams.jobType
      );

      for (let i = 1; i <= pagesToFetch; i++) {
        let url = `${API_BASE_URL}/jobs/adzuna?query=${encodeURIComponent(
          companySearchQuery
        )}&country=${newParams.location}&page=${i}`;

        if (newParams.city) {
          url += `&city=${encodeURIComponent(newParams.city)}`;
        }
        if (newParams.category) {
          url += `&category=${encodeURIComponent(newParams.category)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          allJobs = [...allJobs, ...data.results];
        }

        if (i === 1 && data.mean) {
          meanSalary = data.mean;
        }

        // Add delay between requests to avoid rate limiting
        if (i < pagesToFetch) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      // Apply filters (work type only - job type filtering done at API level)
      let filteredJobs = allJobs;

      if (newParams.workType !== "all") {
        filteredJobs = filteredJobs.filter((job) => {
          const title = job.title?.toLowerCase() || "";
          const description = job.description?.toLowerCase() || "";
          const combined = title + " " + description;

          if (newParams.workType === "remote") {
            return (
              combined.includes("remote") ||
              combined.includes("work from home") ||
              combined.includes("wfh")
            );
          } else if (newParams.workType === "onsite") {
            return (
              !combined.includes("remote") &&
              !combined.includes("work from home") &&
              !combined.includes("hybrid")
            );
          } else if (newParams.workType === "hybrid") {
            return combined.includes("hybrid");
          }
          return true;
        });
      }

      setJobs(filteredJobs);
      setStats({
        count: filteredJobs.length,
        mean: meanSalary,
      });

      // Scroll to top to see results
      window.scrollTo({top: 0, behavior: "smooth"});

      if (filteredJobs.length === 0) {
        toast.error(`No jobs found from ${companyName}`);
      } else {
        toast.success(`Found ${filteredJobs.length} jobs from ${companyName}`, {
          icon: "🏢",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error searching company jobs:", error);
      toast.error("Failed to search jobs. Please try again.");
    } finally {
      setLoadingFalse();
    }
  };

  const getWorkTypeFromJob = (job) => {
    const title = job.title?.toLowerCase() || "";
    const description = job.description?.toLowerCase() || "";
    const combined = title + " " + description;

    if (
      combined.includes("remote") ||
      combined.includes("work from home") ||
      combined.includes("wfh")
    ) {
      return {
        label: "Remote",
        color:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        icon: "🏠",
      };
    } else if (combined.includes("hybrid")) {
      return {
        label: "Hybrid",
        color:
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
        icon: "🔄",
      };
    } else {
      return {
        label: "On-site",
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        icon: "🏢",
      };
    }
  };

  const getJobTypeFromJob = (job) => {
    const title = job.title?.toLowerCase() || "";
    const description = job.description?.toLowerCase() || "";
    const combined = title + " " + description;

    if (
      combined.includes("intern") ||
      combined.includes("internship") ||
      combined.includes("trainee")
    ) {
      return {
        label: "Internship",
        color:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
        icon: "🎓",
      };
    } else {
      return {
        label: "Job",
        color:
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
        icon: "💼",
      };
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return "Salary not specified";
    if (min && max) {
      return `₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString(
        "en-IN"
      )}`;
    }
    return min
      ? `₹${min.toLocaleString("en-IN")}+`
      : `Up to ₹${max.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Toggle job description expansion
  const toggleJobDescription = (jobId) => {
    setExpandedJobs((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  // Open job details modal
  const openJobModal = (job) => {
    setSelectedJob(job);
    setShowJobModalTrue();
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  };

  // Close job details modal
  const closeJobModal = () => {
    setShowJobModalFalse();
    setSelectedJob(null);
    document.body.style.overflow = "unset"; // Re-enable scrolling
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="workspace-container py-8 space-y-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Job Search in India 🇮🇳
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Find your dream job or internship in India - Remote, On-site, or
            Hybrid positions
          </p>
        </div>

        {/* Unified Filter Tabs */}
        <div className="w-full mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
            {/* Main Category Tabs */}
            <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              {jobTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setSearchParams({
                      ...searchParams,
                      jobType: type.value,
                      page: 1,
                    });
                    setActiveJobType(type.value);
                  }}
                  className={`flex-1 min-w-[150px] px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeJobType === type.value
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <span className="text-xl">{type.icon}</span>
                  <span className="hidden sm:inline">{type.label}</span>
                  {activeJobType === type.value && stats && (
                    <span className="ml-1 px-2 py-0.5 bg-white/30 rounded-full text-xs font-bold">
                      {stats.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Work Type Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {workTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setSearchParams({
                      ...searchParams,
                      workType: type.value,
                      page: 1,
                    });
                    setActiveTab(type.value);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeTab === type.value
                      ? "bg-blue-600 text-gray-900 dark:text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="w-full mb-8">
          <form
            onSubmit={handleSearch}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <div className="grid grid-cols-1 gap-4 mb-4">
              {/* Job Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 dark:text-gray-300 mb-2">
                  <Search className="inline w-4 h-4 mr-2" />
                  Job Title or Keywords (Optional)
                </label>
                <input
                  type="text"
                  value={searchParams.query}
                  onChange={(e) =>
                    setSearchParams({...searchParams, query: e.target.value})
                  }
                  placeholder="e.g., Software Developer, Marketing Manager (or leave empty for all jobs)"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              type="button"
              onClick={toggleShowAdvanced}
              className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-4 flex items-center gap-2 hover:underline"
            >
              <Filter className="w-4 h-4" />
              {showAdvanced
                ? "Hide Advanced Filters"
                : "Show Advanced Filters (City, Category)"}
            </button>

            {/* Advanced Filters */}
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                {/* City Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="inline w-4 h-4 mr-2" />
                    City
                  </label>
                  <select
                    value={searchParams.city}
                    onChange={(e) =>
                      setSearchParams({...searchParams, city: e.target.value})
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {indianCities.map((city) => (
                      <option key={city.value} value={city.value}>
                        {city.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 dark:text-gray-300 mb-2">
                    <Briefcase className="inline w-4 h-4 mr-2" />
                    Category
                  </label>
                  <select
                    value={searchParams.category}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.tag} value={cat.tag}>
                        {cat.label} ({cat.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  <span>Find Jobs</span>
                </>
              )}
            </button>
          </form>

          {/* Stats - Compact Design */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl shadow-sm p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Jobs Found
                  </p>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.count.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl shadow-sm p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">
                    Avg. Salary
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  ₹{Math.round(stats.mean).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}

          {/* Top Companies - More Compact */}
          {topCompanies.length > 0 && (
            <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-600">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Top Hiring Companies
              </h3>
              <div className="flex flex-wrap gap-2">
                {topCompanies.slice(0, 10).map((company, index) => (
                  <button
                    key={index}
                    onClick={() => handleCompanyClick(company.canonical_name)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md"
                    title={`${company.count} jobs from ${company.canonical_name}`}
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {company.canonical_name}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
                      {company.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Job Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="w-full">
            <div className="space-y-4">
              {jobs
                .slice((currentPage - 1) * 10, currentPage * 10) // Show 10 jobs per page
                .map((job, index) => (
                  <div
                    key={job.id || index}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-200 p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        {/* Job Title */}
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-900 dark:text-white mb-2">
                          {job.title}
                        </h3>

                        {/* Company */}
                        <div className="flex items-center text-gray-600 dark:text-gray-600 dark:text-gray-400 mb-2">
                          <Building2 className="w-4 h-4 mr-2" />
                          <span className="font-medium">
                            {job.company?.display_name ||
                              "Company not specified"}
                          </span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center text-gray-600 dark:text-gray-600 dark:text-gray-400 mb-3">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>
                            {job.location?.display_name ||
                              "Location not specified"}
                          </span>
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                          <p
                            className={`text-gray-700 dark:text-gray-700 dark:text-gray-300 ${
                              expandedJobs[job.id] ? "" : "line-clamp-3"
                            }`}
                          >
                            {job.description?.replace(/<[^>]*>/g, "") ||
                              "No description available"}
                          </p>
                          {job.description &&
                            job.description.replace(/<[^>]*>/g, "").length >
                              200 && (
                              <button
                                onClick={() => toggleJobDescription(job.id)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium mt-2 flex items-center gap-1"
                              >
                                {expandedJobs[job.id] ? (
                                  <>
                                    Show Less
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 15l7-7 7 7"
                                      />
                                    </svg>
                                  </>
                                ) : (
                                  <>
                                    Show More
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </>
                                )}
                              </button>
                            )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {/* Job Type Badge (Internship/Job) */}
                          {(() => {
                            const jobType = getJobTypeFromJob(job);
                            return (
                              <span
                                className={`px-3 py-1 ${
                                  jobType.color
                                } text-xs font-semibold rounded-full flex items-center gap-1 ring-2 ring-offset-1 ${
                                  jobType.label === "Internship"
                                    ? "ring-yellow-400 dark:ring-yellow-600"
                                    : "ring-indigo-400 dark:ring-indigo-600"
                                }`}
                              >
                                <span>{jobType.icon}</span>
                                <span>{jobType.label}</span>
                              </span>
                            );
                          })()}
                          {/* Work Type Badge */}
                          {(() => {
                            const workType = getWorkTypeFromJob(job);
                            return (
                              <span
                                className={`px-3 py-1 ${workType.color} text-xs font-medium rounded-full flex items-center gap-1`}
                              >
                                <span>{workType.icon}</span>
                                <span>{workType.label}</span>
                              </span>
                            );
                          })()}
                          {job.category?.label && (
                            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">
                              {job.category.label}
                            </span>
                          )}
                          {job.contract_time && (
                            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                              {job.contract_time}
                            </span>
                          )}
                          {job.contract_type && (
                            <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-medium rounded-full">
                              {job.contract_type}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Side - Salary & Actions */}
                      <div className="flex flex-col items-end space-y-3">
                        {/* Salary */}
                        <div className="text-right">
                          <div className="flex items-center text-green-600 dark:text-green-400 font-semibold text-lg">
                            <DollarSign className="w-5 h-5 mr-1" />
                            {formatSalary(job.salary_min, job.salary_max)}
                          </div>
                        </div>

                        {/* Date Posted */}
                        <div className="flex items-center text-gray-500 dark:text-gray-500 dark:text-gray-600 dark:text-gray-400 text-sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(job.created)}
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col gap-2 w-full">
                          {/* View Details Button */}
                          <button
                            onClick={() => openJobModal(job)}
                            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-gray-900 dark:text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </button>

                          {/* Apply Button */}
                          <a
                            href={job.redirect_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                          >
                            Apply Now
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* No Results */}
            {jobs.length === 0 && !loading && (
              <div className="text-center py-20">
                <Briefcase className="w-16 h-16 mx-auto text-gray-600 dark:text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-900 dark:text-white mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or location
                </p>
              </div>
            )}

            {/* Pagination */}
            {jobs.length > 0 && (
              <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
                {/* Previous Button */}
                <button
                  onClick={() => {
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                      window.scrollTo({top: 0, behavior: "smooth"});
                    }
                  }}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                {Array.from(
                  {length: Math.min(totalPages, Math.ceil(jobs.length / 10))},
                  (_, i) => i + 1
                ).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      window.scrollTo({top: 0, behavior: "smooth"});
                    }}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent font-semibold shadow-md"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  onClick={() => {
                    const maxPage = Math.ceil(jobs.length / 10);
                    if (currentPage < maxPage) {
                      setCurrentPage(currentPage + 1);
                      window.scrollTo({top: 0, behavior: "smooth"});
                    }
                  }}
                  disabled={currentPage >= Math.ceil(jobs.length / 10)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="max-w-5xl mx-auto mt-12 text-center text-sm text-gray-500 dark:text-gray-500 dark:text-gray-400">
          <p>
            Powered by{" "}
            <a
              href="https://developer.adzuna.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Adzuna API
            </a>
            . Job listings are updated in real-time from thousands of sources.
          </p>
        </div>

        {/* Job Details Modal */}
        {showJobModal && selectedJob && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={closeJobModal}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Fixed */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 flex justify-between items-start flex-shrink-0">
                <div className="flex-1 pr-4">
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedJob.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span>
                        {selectedJob.company?.display_name ||
                          "Company not specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {selectedJob.location?.display_name ||
                          "Location not specified"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeJobModal}
                  className="text-gray-900 dark:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Salary & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                      <DollarSign className="w-5 h-5" />
                      <span className="font-semibold">Salary</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatSalary(
                        selectedJob.salary_min,
                        selectedJob.salary_max
                      )}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                      <Calendar className="w-5 h-5" />
                      <span className="font-semibold">Posted</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatDate(selectedJob.created)}
                    </p>
                  </div>
                </div>

                {/* Job Tags */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 dark:text-white mb-3">
                    Job Type
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const jobType = getJobTypeFromJob(selectedJob);
                      return (
                        <span
                          className={`px-4 py-2 ${
                            jobType.color
                          } text-sm font-semibold rounded-full flex items-center gap-2 ring-2 ring-offset-1 ${
                            jobType.label === "Internship"
                              ? "ring-yellow-400 dark:ring-yellow-600"
                              : "ring-indigo-400 dark:ring-indigo-600"
                          }`}
                        >
                          <span className="text-xl">{jobType.icon}</span>
                          <span>{jobType.label}</span>
                        </span>
                      );
                    })()}
                    {(() => {
                      const workType = getWorkTypeFromJob(selectedJob);
                      return (
                        <span
                          className={`px-4 py-2 ${workType.color} text-sm font-medium rounded-full flex items-center gap-2`}
                        >
                          <span className="text-xl">{workType.icon}</span>
                          <span>{workType.label}</span>
                        </span>
                      );
                    })()}
                    {selectedJob.category?.label && (
                      <span className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium rounded-full">
                        {selectedJob.category.label}
                      </span>
                    )}
                    {selectedJob.contract_time && (
                      <span className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-full">
                        {selectedJob.contract_time}
                      </span>
                    )}
                    {selectedJob.contract_type && (
                      <span className="px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm font-medium rounded-full">
                        {selectedJob.contract_type}
                      </span>
                    )}
                  </div>
                </div>

                {/* Full Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 dark:text-white mb-3">
                    Job Description Preview
                  </h3>
                  <div
                    className="text-gray-700 dark:text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700"
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {selectedJob.description ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: selectedJob.description,
                        }}
                        style={{
                          fontSize: "15px",
                          lineHeight: "1.7",
                        }}
                      />
                    ) : (
                      <p className="text-gray-500 dark:text-gray-500 dark:text-gray-600 dark:text-gray-400 italic">
                        No description available
                      </p>
                    )}
                  </div>
                  <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        <strong>Note:</strong> This is a preview. Click "Apply
                        Now on Adzuna" below to see the complete job
                        description, requirements, and application details on
                        the official job posting page.
                      </span>
                    </p>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="space-y-3">
                  <a
                    href={selectedJob.redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center text-lg shadow-lg hover:shadow-xl"
                  >
                    <ExternalLink className="w-6 h-6 mr-3" />
                    View Complete Job Details & Apply on Adzuna
                  </a>
                  <button
                    onClick={closeJobModal}
                    className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSearch;
