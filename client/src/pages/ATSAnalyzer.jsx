import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SEO from "@/components/common/SEO";
import { resumeAPI } from "@/api/api";
import { useToggle } from "@/hooks";
import { handleApiError } from "@/utils/errorHandler";
import {
  ATSAnalyzerBanner,
  ATSJobDescriptionInput,
  ATSResumeSelector,
  ATSScoreHero,
  ATSResultsBreakdown,
  ATSEmptyState,
  ATSLoadingState,
} from "@/components/atsAnalyzer";

export default function ATSAnalyzer() {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [selectedResume, setSelectedResume] = useState(null);
  const [useCareerProfile, setUseCareerProfile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analyzing, , setAnalyzingTrue, setAnalyzingFalse] = useToggle(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [userResumes, setUserResumes] = useState([]);
  const [loadingResumes, , , setLoadingResumesFalse] = useToggle(true);
  const [showAllImprovements, setShowAllImprovements] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    recommendations: true,
    strengths: true,
    keywords: true,
  });

  // Load user's resumes on mount
  useEffect(() => {
    const loadResumes = async () => {
      try {
        const response = await resumeAPI.list();
        setUserResumes(response.data?.resumes || []);
      } catch (error) {
        console.error("Failed to load resumes:", error);
      } finally {
        setLoadingResumesFalse();
      }
    };
    loadResumes();
  }, [setLoadingResumesFalse]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (
      file &&
      (file.type === "application/pdf" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ) {
      setUploadedFile(file);
      setSelectedResume(null);
      setUseCareerProfile(false);
      toast.success(`Attached ${file.name}`);
    } else {
      toast.error("Please upload a PDF or DOCX file", {
        icon: "📄",
        duration: 3000,
      });
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description", {
        icon: "📝",
        duration: 3000,
      });
      return;
    }

    if (!useCareerProfile && !selectedResume && !uploadedFile) {
      toast.error("Please select a resume, use Career Profile, or upload a file", {
        icon: "📁",
        duration: 3000,
      });
      return;
    }

    setAnalyzingTrue();
    setAnalysisResult(null);
    setShowAllImprovements(false);
    setExpandedSections({
      recommendations: true,
      strengths: false,
      keywords: false,
    });

    try {
      const formData = new FormData();
      formData.append("jobDescription", jobDescription);

      if (useCareerProfile) {
        formData.append("useCareerProfile", "true");
      } else if (uploadedFile) {
        formData.append("resumeFile", uploadedFile);
      } else if (selectedResume) {
        formData.append("resumeId", selectedResume);
      }

      const response = await resumeAPI.analyzeResume(formData);
      setAnalysisResult(response.data);
      toast.success("Analysis completed successfully!", {
        icon: "✅",
        duration: 2500,
      });
    } catch (error) {
      handleApiError(error, "Failed to analyze resume", toast);
    } finally {
      setAnalyzingFalse();
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleEditRecommendation = (recommendation) => {
    let targetResumeId = selectedResume;

    if (!targetResumeId && userResumes && userResumes.length > 0) {
      targetResumeId = userResumes[0]._id;
    }

    if (targetResumeId) {
      localStorage.setItem("currentResumeId", targetResumeId);
    }

    toast.success("Opening Resume Editor with recommendation...", {
      icon: "🎯",
      duration: 2000,
    });

    navigate("/editor", {
      state: {
        atsRecommendation: recommendation,
        fromATS: true,
        jobDescription: jobDescription,
      },
    });
  };

  const [showInputs, setShowInputs] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] text-gray-900 dark:text-zinc-100 transition-colors duration-200">
      <SEO
        title="Free ATS Resume Score Checker &amp; Compatibility Analyzer"
        description="Check your resume's ATS score in real time against job descriptions. Discover missing keywords, fix formatting flaws, and pass Taleo, Workday, Greenhouse &amp; Lever filters."
        keywords="ATS resume checker, free ATS score test, Taleo resume scanner, Workday resume checker, ATS compatibility analyzer, keyword gap scanner, resume score checker, pass ATS 2026"
        url="https://www.smartnshine.in/ats-analyzer"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "SmartNShine ATS Resume Compatibility Analyzer",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All",
          "url": "https://www.smartnshine.in/ats-analyzer",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "640"
          }
        }}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Ambient Top Hero Banner */}
        <ATSAnalyzerBanner />

        {/* If no analysis result, show the initial input & empty/loading state */}
        {!analysisResult ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Inputs */}
            <div className="lg:col-span-6 space-y-6">
              <ATSJobDescriptionInput
                jobDescription={jobDescription}
                setJobDescription={setJobDescription}
              />

              <ATSResumeSelector
                useCareerProfile={useCareerProfile}
                setUseCareerProfile={setUseCareerProfile}
                userResumes={userResumes}
                loadingResumes={loadingResumes}
                selectedResume={selectedResume}
                setSelectedResume={setSelectedResume}
                uploadedFile={uploadedFile}
                setUploadedFile={setUploadedFile}
                handleFileUpload={handleFileUpload}
                analyzing={analyzing}
                handleAnalyze={handleAnalyze}
                jobDescription={jobDescription}
              />
            </div>

            {/* Right Column: Empty or Loading State */}
            <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-6">
              {analyzing ? <ATSLoadingState /> : <ATSEmptyState />}
            </div>
          </div>
        ) : (
          /* Output View: Full-width 2-column layout */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Toolbar / Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-gray-200/80 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowInputs(!showInputs)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  {showInputs ? "Hide Input Settings" : "Modify Job Description / Resume"}
                </button>
                <button
                  type="button"
                  onClick={() => setAnalysisResult(null)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Start New Analysis
                </button>
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {analyzing ? "Re-analyzing..." : "Re-run Deep ATS Analysis"}
              </button>
            </div>

            {/* Collapsible Inputs in Output View */}
            {showInputs && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-3xl bg-gray-50 dark:bg-zinc-950/60 border border-gray-200 dark:border-white/10 animate-in fade-in duration-200">
                <div className="lg:col-span-6">
                  <ATSJobDescriptionInput
                    jobDescription={jobDescription}
                    setJobDescription={setJobDescription}
                  />
                </div>
                <div className="lg:col-span-6">
                  <ATSResumeSelector
                    useCareerProfile={useCareerProfile}
                    setUseCareerProfile={setUseCareerProfile}
                    userResumes={userResumes}
                    loadingResumes={loadingResumes}
                    selectedResume={selectedResume}
                    setSelectedResume={setSelectedResume}
                    uploadedFile={uploadedFile}
                    setUploadedFile={setUploadedFile}
                    handleFileUpload={handleFileUpload}
                    analyzing={analyzing}
                    handleAnalyze={handleAnalyze}
                    jobDescription={jobDescription}
                  />
                </div>
              </div>
            )}

            {/* 2-Column Output Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Column: Full Analysis Score & Strength Signals */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Full Analysis</h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Your overall ATS score and verified resume strengths.</p>
                </div>

                <ATSScoreHero analysisResult={analysisResult} />

                <ATSResultsBreakdown
                  analysisResult={analysisResult}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  showAllImprovements={showAllImprovements}
                  setShowAllImprovements={setShowAllImprovements}
                  onEditResume={handleEditRecommendation}
                  showRecommendations={false}
                  showKeywords={false}
                  showStrengths={true}
                />
              </div>

              {/* Right Column: Resume Improvements & Actionable Recommendations & Missing Keywords */}
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      Resume Improvements
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                      Choose a specific action to update your resume faster.
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    Next steps
                  </span>
                </div>

                <ATSResultsBreakdown
                  analysisResult={analysisResult}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  showAllImprovements={showAllImprovements}
                  setShowAllImprovements={setShowAllImprovements}
                  onEditResume={handleEditRecommendation}
                  showRecommendations={true}
                  showKeywords={true}
                  showStrengths={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
