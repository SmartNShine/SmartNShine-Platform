import {useState, useEffect} from "react";
import {
  Sparkles,
  Briefcase,
  MapPin,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  ExternalLink,
  Heart,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Home,
  Users,
  Globe,
} from "lucide-react";
import toast from "react-hot-toast";
import {useToggle} from "@/hooks";

const SmartJobMatch = ({resumeData}) => {
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loading, toggleLoading, setLoadingTrue, setLoadingFalse] =
    useToggle(false);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [selectedJob, setSelectedJob] = useState(null);
  const [
    showJobModal,
    toggleJobModal,
    setShowJobModalTrue,
    setShowJobModalFalse,
  ] = useToggle(false);
  const [searchKeywords, setSearchKeywords] = useState([]);

  // New state for filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [jobTypeFilter, setJobTypeFilter] = useState("all"); // "all", "jobs", "internships"
  const [workModeFilter, setWorkModeFilter] = useState("all"); // "all", "remote", "hybrid", "onsite"
  const [viewMode, setViewMode] = useState("matches"); // "matches", "saved"
  const jobsPerPage = 12;

  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Fetch smart job matches
  const fetchSmartMatches = async (specificJobType = null) => {
    if (!resumeData || !resumeData.skills || resumeData.skills.length === 0) {
      toast.error("Please add skills to your resume first!");
      return;
    }

    setLoadingTrue();
    console.log("🚀 Starting smart job match...");

    // Ensure specificJobType is a string or null (not an event object)
    const validJobType =
      typeof specificJobType === "string" ? specificJobType : null;

    // Use specific job type if provided, otherwise use current filter
    const typeToFetch =
      validJobType || (jobTypeFilter === "all" ? null : jobTypeFilter);

    try {
      const requestBody = {
        skills: resumeData.skills || [],
        experience: resumeData.experience || [],
        summary: resumeData.summary || "",
        education: resumeData.education || [],
        jobTitle: resumeData.experience?.[0]?.title || "",
        location: resumeData.contact?.location || "",
        jobType: typeToFetch, // Send job type to backend
      };
      console.log("📤 Request body:", requestBody);
      console.log("🏷️ Job type being sent:", typeToFetch);

      const response = await fetch(`${API_BASE_URL}/jobs/smart-match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API error:", errorText);
        throw new Error("Failed to fetch matched jobs");
      }

      const data = await response.json();
      console.log("📦 API response:", data);
      console.log("💼 Jobs found:", data.results?.length || 0);
      console.log("💼 Jobs found:", data.results?.length || 0);

      setMatchedJobs(data.results || []);
      setSearchKeywords(data.searchKeywords || []);

      if (data.results && data.results.length > 0) {
        toast.success(
          `Found ${data.results.length} jobs matching your resume! 🎯`,
          {
            icon: "✨",
            duration: 3000,
          }
        );
      } else {
        console.log("⚠️ No jobs returned from Adzuna");
        toast("No perfect matches found. Try updating your resume!", {
          icon: "🔍",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error fetching smart matches:", error);
      toast.error("Failed to fetch job matches. Please try again.");
    } finally {
      setLoadingFalse();
    }
  };

  // Toggle save job
  const toggleSaveJob = (jobId) => {
    const newSavedJobs = new Set(savedJobs);
    if (savedJobs.has(jobId)) {
      newSavedJobs.delete(jobId);
      toast.success("Job removed from saved list");
    } else {
      newSavedJobs.add(jobId);
      toast.success("Job saved! ❤️");
    }
    setSavedJobs(newSavedJobs);
    // TODO: Save to backend/localStorage
  };

  // Open job modal
  const openJobModal = (job) => {
    setSelectedJob(job);
    setShowJobModalTrue();
    document.body.style.overflow = "hidden";
  };

  // Close job modal
  const closeJobModal = () => {
    setShowJobModalFalse();
    setSelectedJob(null);
    document.body.style.overflow = "unset";
  };

  // Format salary
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

  // Format date
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

  // Get match color based on percentage
  const getMatchColor = (percentage) => {
    if (percentage >= 80)
      return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    if (percentage >= 60)
      return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
    if (percentage >= 40)
      return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400";
  };

  // Check if job is an internship
  const isInternship = (job) => {
    const title = job.title?.toLowerCase() || "";
    const description = job.description?.toLowerCase() || "";
    const category = job.category?.label?.toLowerCase() || "";

    // Multiple detection patterns
    const internshipKeywords = [
      "intern",
      "internship",
      "trainee",
      "graduate program",
      "entry level",
      "fresher",
      "apprentice",
      "co-op",
      "student position",
    ];

    // Check title (highest priority)
    for (const keyword of internshipKeywords) {
      if (title.includes(keyword)) return true;
    }

    // Check description (medium priority)
    for (const keyword of internshipKeywords) {
      if (description.includes(keyword)) return true;
    }

    // Check category
    if (category.includes("intern") || category.includes("graduate"))
      return true;

    return false;
  };

  // Check work mode (remote/hybrid/onsite)
  const getWorkMode = (job) => {
    const title = job.title?.toLowerCase() || "";
    const description = job.description?.toLowerCase() || "";
    const location = job.location?.display_name?.toLowerCase() || "";

    if (
      title.includes("remote") ||
      description.includes("remote") ||
      description.includes("work from home")
    ) {
      return "remote";
    }
    if (title.includes("hybrid") || description.includes("hybrid")) {
      return "hybrid";
    }
    return "onsite";
  };

  // Filter jobs based on selected filters
  const getFilteredJobs = () => {
    let filtered = matchedJobs;

    // Filter by job type (jobs/internships)
    if (jobTypeFilter === "jobs") {
      filtered = filtered.filter((job) => !isInternship(job));
    } else if (jobTypeFilter === "internships") {
      filtered = filtered.filter((job) => isInternship(job));
    }

    // Filter by work mode
    if (workModeFilter !== "all") {
      filtered = filtered.filter((job) => getWorkMode(job) === workModeFilter);
    }

    // If viewing saved jobs only
    if (viewMode === "saved") {
      filtered = filtered.filter((job) => savedJobs.has(job.id));
    }

    return filtered;
  };

  // Get paginated jobs
  const getPaginatedJobs = () => {
    const filtered = getFilteredJobs();
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(getFilteredJobs().length / jobsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [jobTypeFilter, workModeFilter, viewMode]);

  // Clear jobs when resume changes and notify user
  useEffect(() => {
    if (resumeData) {
      // Clear previous job matches when resume changes
      setMatchedJobs([]);
      setSearchKeywords([]);
      setCurrentPage(1);
      setSavedJobs(new Set());

      console.log("🔄 Resume changed, cleared previous matches");
      console.log("📝 New resume:", resumeData.resumeTitle || resumeData.name);

      // Show notification about resume change
      toast(
        `Resume switched to: ${
          resumeData.resumeTitle || resumeData.name
        }. Click "Find Jobs" to get new matches!`,
        {
          icon: "🔄",
          duration: 4000,
        }
      );
    }
  }, [resumeData?._id]); // Only trigger when resume ID changes

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="workspace-container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="w-10 h-10 text-blue-600 animate-pulse" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Smart Job Match
            </h1>
            <Sparkles className="w-10 h-10 text-indigo-600 animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            AI-powered job recommendations tailored to your resume. Get
            personalized matches with insights on why each job fits your
            profile.
          </p>
        </div>

        {/* Search Keywords Display */}
        {searchKeywords.length > 0 && (
          <div className="w-full mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Matching based on your skills:
            </h3>
            <div className="flex flex-wrap gap-2">
              {searchKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* View Mode Tabs (Matches / Saved Jobs) */}
        {matchedJobs.length > 0 && (
          <div className="w-full mb-6">
            <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2">
              <button
                onClick={() => setViewMode("matches")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === "matches"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                All Matches ({matchedJobs.length})
              </button>
              <button
                onClick={() => setViewMode("saved")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === "saved"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Bookmark className="w-5 h-5" />
                Saved Jobs ({savedJobs.size})
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        {matchedJobs.length > 0 && (
          <div className="w-full mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {/* Job Type Filter */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Job Type (Click to search specific type)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setJobTypeFilter("all");
                    if (matchedJobs.length > 0) {
                      fetchSmartMatches(null); // Fetch all types
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    jobTypeFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setJobTypeFilter("jobs");
                    if (matchedJobs.length > 0) {
                      fetchSmartMatches("jobs"); // Fetch only full-time jobs
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    jobTypeFilter === "jobs"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Full-time Jobs
                </button>
                <button
                  onClick={() => {
                    setJobTypeFilter("internships");
                    fetchSmartMatches("internships"); // Fetch only internships
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    jobTypeFilter === "internships"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Internships
                </button>
              </div>
            </div>

            {/* Work Mode Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Work Mode
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setWorkModeFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    workModeFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setWorkModeFilter("remote")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    workModeFilter === "remote"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Remote
                </button>
                <button
                  onClick={() => setWorkModeFilter("hybrid")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    workModeFilter === "hybrid"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Hybrid
                </button>
                <button
                  onClick={() => setWorkModeFilter("onsite")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    workModeFilter === "onsite"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  On-site
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Find Matches Button */}
        {matchedJobs.length === 0 && !loading && (
          <div className="w-full mb-8 text-center">
            <button
              onClick={() => fetchSmartMatches()}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Finding perfect matches...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Find Jobs Matching My Resume
                  <TrendingUp className="w-6 h-6" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Analyzing your resume and finding perfect matches...
            </p>
          </div>
        )}

        {/* Matched Jobs */}
        {!loading && matchedJobs.length > 0 && (
          <div className="w-full">
            {/* Stats */}
            <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    {getFilteredJobs().length}{" "}
                    {viewMode === "saved"
                      ? "Saved Jobs"
                      : "Personalized Recommendations"}
                  </h2>
                  <p className="text-blue-100">
                    {viewMode === "saved"
                      ? "Your saved job listings"
                      : "Ranked by relevance to your resume"}
                  </p>
                </div>
                {viewMode === "matches" && (
                  <button
                    onClick={() => fetchSmartMatches()}
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                  >
                    Refresh Matches
                  </button>
                )}
              </div>
            </div>

            {/* Empty State for Saved Jobs */}
            {viewMode === "saved" && savedJobs.size === 0 && (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <Bookmark className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No Saved Jobs Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Click the heart icon on any job to save it for later
                </p>
                <button
                  onClick={() => setViewMode("matches")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  Browse All Matches
                </button>
              </div>
            )}

            {/* Empty State for Filters */}
            {getFilteredJobs().length === 0 &&
              (viewMode === "matches" || savedJobs.size > 0) && (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <AlertCircle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    No Jobs Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try adjusting your filters to see more results
                  </p>
                  <button
                    onClick={() => {
                      setJobTypeFilter("all");
                      setWorkModeFilter("all");
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

            {/* Job Cards */}
            {getFilteredJobs().length > 0 && (
              <>
                <div className="space-y-4">
                  {getPaginatedJobs().map((job, index) => (
                    <div
                      key={job.id || index}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-all duration-200 p-6 border-l-4 border-blue-600"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        {/* Left Side - Job Info */}
                        <div className="flex-1">
                          {/* Match Badge */}
                          <div className="flex items-center gap-3 mb-3">
                            <span
                              className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${getMatchColor(
                                job.matchPercentage
                              )}`}
                            >
                              <TrendingUp className="w-4 h-4" />
                              {job.matchPercentage}% Match
                            </span>
                            {job.matchPercentage >= 80 && (
                              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                                🎯 Excellent Fit!
                              </span>
                            )}
                          </div>

                          {/* Job Title */}
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {job.title}
                          </h3>

                          {/* Company & Location */}
                          <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 mb-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              <span className="font-medium">
                                {job.company?.display_name ||
                                  "Company not specified"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {job.location?.display_name ||
                                  "Location not specified"}
                              </span>
                            </div>
                          </div>

                          {/* Why This Fits */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-3">
                            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Why this job fits you:
                            </h4>
                            <ul className="space-y-1">
                              {job.matchInsights.map((insight, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                                >
                                  <span className="text-blue-600 dark:text-blue-400">
                                    •
                                  </span>
                                  {insight}
                                </li>
                              ))}
                            </ul>
                            {job.matchedKeywords &&
                              job.matchedKeywords.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                    Matched Skills:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {job.matchedKeywords
                                      .slice(0, 8)
                                      .map((keyword, kidx) => (
                                        <span
                                          key={kidx}
                                          className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium"
                                        >
                                          ✓ {keyword}
                                        </span>
                                      ))}
                                  </div>
                                </div>
                              )}
                          </div>

                          {/* Category Badge */}
                          {job.category?.label && (
                            <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                              {job.category.label}
                            </span>
                          )}
                        </div>

                        {/* Right Side - Actions */}
                        <div className="flex flex-col items-end space-y-3 min-w-[200px]">
                          {/* Salary */}
                          <div className="text-right">
                            <div className="flex items-center text-green-600 dark:text-green-400 font-semibold text-lg">
                              <DollarSign className="w-5 h-5 mr-1" />
                              {formatSalary(job.salary_min, job.salary_max)}
                            </div>
                          </div>

                          {/* Date Posted */}
                          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(job.created)}
                          </div>

                          {/* Buttons */}
                          <div className="flex flex-col gap-2 w-full">
                            {/* View Details */}
                            <button
                              onClick={() => openJobModal(job)}
                              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>

                            {/* Save Job */}
                            <button
                              onClick={() => toggleSaveJob(job.id)}
                              className={`${
                                savedJobs.has(job.id)
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              } hover:bg-opacity-80 font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2`}
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  savedJobs.has(job.id) ? "fill-current" : ""
                                }`}
                              />
                              {savedJobs.has(job.id) ? "Saved" : "Save Job"}
                            </button>

                            {/* Apply Now */}
                            <a
                              href={job.redirect_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                            >
                              Apply Now
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>

                    <div className="flex gap-2">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 &&
                            pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                currentPage === pageNum
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return (
                            <span
                              key={pageNum}
                              className="px-2 py-2 text-gray-500 dark:text-gray-400"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && matchedJobs.length === 0 && searchKeywords.length > 0 && (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No perfect matches found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try updating your resume with more skills or experience
            </p>
            <button
              onClick={() => fetchSmartMatches()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
            >
              Try Again
            </button>
          </div>
        )}

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
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-start flex-shrink-0">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold">
                      {selectedJob.matchPercentage}% Match
                    </span>
                  </div>
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
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Match Insights */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    Why This Job Is Perfect For You
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <ul className="space-y-2">
                      {selectedJob.matchInsights.map((insight, idx) => (
                        <li
                          key={idx}
                          className="text-gray-700 dark:text-gray-300 flex items-start gap-2"
                        >
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

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

                {/* Job Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Job Description Preview
                  </h3>
                  <div
                    className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedJob.description || "No description available",
                    }}
                  />
                  <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        <strong>Note:</strong> This is a preview. Click "Apply
                        Now" below to see complete details on the official job
                        posting.
                      </span>
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <a
                    href={selectedJob.redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center text-lg shadow-lg hover:shadow-xl"
                  >
                    <ExternalLink className="w-6 h-6 mr-3" />
                    View Complete Details & Apply on Adzuna
                  </a>
                  <button
                    onClick={closeJobModal}
                    className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
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

export default SmartJobMatch;
