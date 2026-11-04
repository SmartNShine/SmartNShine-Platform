import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Sparkles,
  UploadCloud,
  FileText,
  X,
  Send,
  Loader2,
  Clock,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Link as LinkIcon,
  HelpCircle,
  ShieldCheck,
  Zap,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import SEO from "../components/common/SEO";
import LandingNavbar from "../components/landing-v2/LandingNavbar";
import Footer from "../components/layout/Footer";
import { OPEN_ROLES, GENERAL_ROLE_CONFIG } from "../components/careers/careersData";
import { careerApplicationAPI } from "@/api";

const STORAGE_DRAFT_KEY = "smartnshine_career_application_draft";

export default function CareerApplyPage() {
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Find pre-selected role if provided in URL or search params
  const targetRoleId = jobId || searchParams.get("role") || "";

  // Available role choices with their specific form configurations
  const roleOptions = useMemo(() => {
    return [
      ...OPEN_ROLES.map((r) => ({
        id: r.id,
        title: r.title,
        department: r.department,
        summary: r.summary,
        experience: r.experience,
        formConfig: r.formConfig,
      })),
      GENERAL_ROLE_CONFIG,
    ];
  }, []);

  const selectedRoleData = useMemo(() => {
    if (!targetRoleId) return roleOptions[0];
    const match = roleOptions.find((r) => r.id === targetRoleId);
    return match || roleOptions[0];
  }, [targetRoleId, roleOptions]);

  const formConfig = useMemo(() => {
    return selectedRoleData?.formConfig || GENERAL_ROLE_CONFIG.formConfig;
  }, [selectedRoleData]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    timezone: "",
    roleId: selectedRoleData.id,
    roleTitle: selectedRoleData.title,
    department: selectedRoleData.department,
    experienceLevel: selectedRoleData.experience || "Early-Stage Hustler",
    availability: "Part-Time (10-20 hrs/week)",
    startDate: "Immediate",
    workingStyle: "Async-First with Weekly Sprints",
    universityOrOrg: "",
    customRolePitch: "",
    linkedinUrl: "",
    portfolioUrl: "",
    githubUrl: "",
    otherUrl: "",
    bestProjectUrl: "",
    bestProjectDesc: "",
    whyJoin: "",
    scrappyStory: "",
    first30DaysPlan: "",
    roleSpecificAnswer: "",
    marketInsight: "",
    resumeName: "",
    resumeSize: 0,
    resumeData: "",
    additionalNotes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const fileInputRef = useRef(null);

  // Sync role when URL param changes
  useEffect(() => {
    if (selectedRoleData) {
      setFormData((prev) => ({
        ...prev,
        roleId: selectedRoleData.id,
        roleTitle: selectedRoleData.title,
        department: selectedRoleData.department,
        experienceLevel: selectedRoleData.experience || "Early-Stage Hustler",
      }));
    }
  }, [selectedRoleData]);

  // Load draft from localStorage on initial mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          // keep selected role if explicitly requested in URL
          ...(targetRoleId
            ? {
                roleId: selectedRoleData.id,
                roleTitle: selectedRoleData.title,
                department: selectedRoleData.department,
              }
            : {}),
        }));
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      }
    } catch {
      // Ignore draft parse error
    }
  }, [targetRoleId, selectedRoleData]);

  // Auto-save draft on form changes
  const saveDraft = (dataToSave) => {
    try {
      // Do not store heavy resume base64 in localStorage draft to prevent quota limits
      const { resumeData, ...cleanDraft } = dataToSave;
      localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(cleanDraft));
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch {
      // Ignore storage error
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      saveDraft(updated);
      return updated;
    });
  };

  const handleRoleChange = (newRoleId) => {
    const role = roleOptions.find((r) => r.id === newRoleId);
    if (role) {
      setFormData((prev) => {
        const updated = {
          ...prev,
          roleId: role.id,
          roleTitle: role.title,
          department: role.department,
          experienceLevel: role.experience || "Early-Stage Hustler",
        };
        saveDraft(updated);
        return updated;
      });
      navigate(`/careers/apply/${role.id}`, { replace: true });
    }
  };

  // File Upload Handlers
  const handleFileProcess = (file) => {
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("File is too large. Please upload a resume under 8MB.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      toast.error("Please upload a PDF or Word document (.pdf, .docx, .doc).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        resumeName: file.name,
        resumeSize: file.size,
        resumeData: reader.result,
      }));
      toast.success(`Attached ${file.name}`);
    };
    reader.onerror = () => {
      toast.error("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      resumeName: "",
      resumeSize: 0,
      resumeData: "",
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Resume removed");
  };

  // Calculate form completion progress percentage
  const progressPercent = useMemo(() => {
    let score = 0;
    let total = 8;
    if (formData.name.trim()) score++;
    if (formData.email.trim()) score++;
    if (formData.location.trim()) score++;
    if (formData.linkedinUrl.trim() || formData.githubUrl.trim() || formData.portfolioUrl.trim()) score++;
    if (formData.whyJoin.trim().length > 30) score++;
    if (formData.scrappyStory.trim().length > 30) score++;
    if (formData.first30DaysPlan.trim().length > 30) score++;
    if (formData.resumeName || formData.bestProjectUrl.trim()) score++;
    return Math.round((score / total) * 100);
  }, [formData]);

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!formData.whyJoin.trim()) {
      toast.error("Please let us know why you'd like to join SmartNShine.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        source: "careers_full_page",
      };

      // 1. Submit to Backend API via careerApplicationAPI
      let appId = `app-${Date.now()}`;
      try {
        const res = await careerApplicationAPI.submitApplication(payload);
        if (res.data?.success && (res.data?.applicationId || res.data?.application?._id)) {
          appId = res.data.applicationId || res.data.application._id;
        }
      } catch (apiErr) {
        console.warn("Backend submit fallback:", apiErr);
      }

      // 2. Cache in client localStorage for immediate admin dashboard visibility
      try {
        const currentSaved = JSON.parse(
          localStorage.getItem("smartnshine_admin_career_apps") || "[]"
        );
        const newRecord = {
          _id: appId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          timezone: formData.timezone,
          role: formData.roleTitle,
          roleId: formData.roleId,
          department: formData.department,
          experience: formData.experienceLevel,
          availability: formData.availability,
          startDate: formData.startDate,
          workingStyle: formData.workingStyle,
          linkedinUrl: formData.linkedinUrl,
          portfolioUrl: formData.portfolioUrl,
          githubUrl: formData.githubUrl,
          otherUrl: formData.otherUrl,
          bestProjectUrl: formData.bestProjectUrl,
          bestProjectDesc: formData.bestProjectDesc,
          whyJoin: formData.whyJoin,
          scrappyStory: formData.scrappyStory,
          first30DaysPlan: formData.first30DaysPlan,
          roleSpecificAnswer: formData.roleSpecificAnswer,
          universityOrOrg: formData.universityOrOrg,
          customRolePitch: formData.customRolePitch,
          marketInsight: formData.marketInsight,
          resumeName: formData.resumeName || "Resume_Submitted.pdf",
          resumeData: formData.resumeData,
          additionalNotes: formData.additionalNotes,
          status: "pending",
          createdAt: new Date().toISOString(),
          notes: "",
        };
        const updated = [newRecord, ...currentSaved.filter((a) => a._id !== appId)];
        localStorage.setItem("smartnshine_admin_career_apps", JSON.stringify(updated));
      } catch {
        // Ignore cache error
      }

      // 3. Clear draft
      localStorage.removeItem(STORAGE_DRAFT_KEY);

      setSubmittedAppId(appId);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success("Founding Application Received! Founders will review within 48h.");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#070709] text-zinc-900 dark:text-white font-scoutie selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-950 transition-colors duration-500">
      <SEO
        title={`Apply: ${selectedRoleData.title} | SmartNShine Founding Team`}
        description={`Apply for ${selectedRoleData.title} at SmartNShine. Join our 100% remote Day-0 founding team and build the future of AI resume & portfolio platforms.`}
        keywords="SmartNShine application, founding team apply, startup job form, remote hiring"
        url={`https://www.smartnshine.in/careers/apply/${selectedRoleData.id}`}
      />

      {/* Floating Navbar */}
      <LandingNavbar />

      <main className="pt-28 sm:pt-36 pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation & Back Button */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            to="/careers"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Openings</span>
          </Link>

          {lastSavedTime && !isSubmitted && (
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-light flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Draft saved {lastSavedTime}
            </span>
          )}
        </div>

        {/* Celebratory Completion Screen */}
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 sm:p-14 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 text-center max-w-2xl mx-auto shadow-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-zinc-200 dark:border-zinc-700">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Application Received</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-zinc-950 dark:text-white">
                You're in the Founding Circle,{" "}
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {formData.name.split(" ")[0]}!
                </span>
              </h1>

              <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-light leading-relaxed">
                Thank you for your thoughtful application for{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-200">
                  {formData.roleTitle}
                </span>
                . Our technical founders review every single submission personally.
              </p>

              {/* Next Steps Roadmap */}
              <div className="mt-8 p-6 rounded-2xl bg-white dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800 text-left space-y-4 shadow-2xs">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  What Happens Next
                </h4>
                <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 font-light">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <strong className="text-zinc-900 dark:text-zinc-200 font-medium">
                        Founder Direct Review (24–48 Hours)
                      </strong>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        We review your links, answers, and sample projects.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <strong className="text-zinc-900 dark:text-zinc-200 font-medium">
                        30-Min Informal Intro Chat
                      </strong>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        If aligned, we'll schedule a relaxed video chat with the founders.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <strong className="text-zinc-900 dark:text-zinc-200 font-medium">
                        Vision Jam & Pilot Sprint
                      </strong>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Collaborate on a real 1-week pilot experiment to test chemistry.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/"
                  className="px-6 py-3 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-medium transition-all shadow-xs cursor-pointer"
                >
                  Explore SmartNShine Platform
                </Link>
                <Link
                  to="/careers"
                  className="px-6 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm font-medium transition-all cursor-pointer"
                >
                  View Other Roles
                </Link>
              </div>

              {submittedAppId && (
                <p className="mt-6 text-[11px] text-zinc-400 dark:text-zinc-500">
                  Reference ID: <code className="font-mono">{submittedAppId}</code>
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="form-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-10"
            >
              {/* Header Hero Section */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{formConfig?.badge || "Founding Team Application"}</span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-zinc-500 normal-case font-normal">~4 mins to complete</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-950 dark:text-white">
                  Apply for{" "}
                  <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-800 dark:from-white dark:via-zinc-200 dark:to-zinc-400">
                    {selectedRoleData.title}
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-light leading-relaxed max-w-3xl">
                  {selectedRoleData.summary}
                </p>

                {/* Progress Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    <span>Application Completeness</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-zinc-950 dark:bg-white rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Container */}
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* SECTION 0: Role Selector Banner */}
                <div className="p-6 rounded-3xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-white/10 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Applying For Position
                      </label>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        You can switch roles or submit a wildcard application.
                      </p>
                    </div>

                    <div className="relative min-w-[280px]">
                      <select
                        value={formData.roleId}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all appearance-none cursor-pointer pr-10 shadow-2xs"
                      >
                        {roleOptions.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.title} ({role.department})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* SECTION 1: Contact & Fundamentals */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 shadow-2xs space-y-6">
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Step 01
                    </span>
                    <h2 className="text-xl font-medium text-zinc-900 dark:text-white mt-1">
                      Contact & Fundamentals
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      How we can reach out for your founder intro chat.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Morgan"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all"
                      />
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="alex@gmail.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all"
                      />
                    </div>

                    {/* Phone / WhatsApp */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Phone / WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 019-2834 or +91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all"
                      />
                    </div>

                    {/* Current Location & Timezone */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Current Location & Primary Timezone
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. San Francisco (PST) / Bengaluru (IST) / London (GMT)"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all"
                      />
                    </div>

                    {/* Conditional: University / College Field for Campus Leads */}
                    {formConfig?.showUniversityField && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                          University / College, Major & Grad Year
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Stanford University • B.S. Computer Science • Class of 2026"
                          value={formData.universityOrOrg}
                          onChange={(e) => handleInputChange("universityOrOrg", e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all"
                        />
                      </div>
                    )}

                    {/* Conditional: Custom Role Title for Wildcard Pitches */}
                    {formConfig?.showCustomRoleField && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                          Proposed Founding Role Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Founding Product Designer / Creator-in-Residence / Growth Engineer"
                          value={formData.customRolePitch}
                          onChange={(e) => handleInputChange("customRolePitch", e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 2: Proof of Work & Footprint */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 shadow-2xs space-y-6">
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Step 02
                    </span>
                    <h2 className="text-xl font-medium text-zinc-900 dark:text-white mt-1">
                      Proof of Work & Footprint
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Show us what you have created, grown, or shipped.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* LinkedIn */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                        <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                        <span>LinkedIn Profile URL</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={formData.linkedinUrl}
                        onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all"
                      />
                    </div>

                    {/* Portfolio / Personal Website */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Portfolio / Personal Website</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://yourportfolio.com or substack"
                        value={formData.portfolioUrl}
                        onChange={(e) => handleInputChange("portfolioUrl", e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all"
                      />
                    </div>

                    {/* GitHub */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5 text-zinc-400" />
                        <span>GitHub Profile (if applicable)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/username"
                        value={formData.githubUrl}
                        onChange={(e) => handleInputChange("githubUrl", e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all"
                      />
                    </div>

                    {/* Other Social (X, TikTok, YouTube, Discord) */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />
                        <span>X (Twitter) / TikTok / YouTube / Discord</span>
                      </label>
                      <input
                        type="text"
                        placeholder="@handle or channel URL"
                        value={formData.otherUrl}
                        onChange={(e) => handleInputChange("otherUrl", e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Best Single Project or Campaign Showcase (Role Tailored) */}
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200 mb-1">
                        {formConfig?.proofOfWorkTitle || "Link to your #1 best project, growth campaign, repository, or launch"}
                      </label>
                      <input
                        type="url"
                        placeholder={formConfig?.proofOfWorkPlaceholder || "https://..."}
                        value={formData.bestProjectUrl}
                        onChange={(e) => handleInputChange("bestProjectUrl", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200 mb-1">
                        1-2 sentences on what you accomplished and why it represents your craft
                      </label>
                      <input
                        type="text"
                        placeholder={formConfig?.proofOfWorkDescPlaceholder || "e.g. Scaled Discord to 2,000 active students and ran weekly resume roasts."}
                        value={formData.bestProjectDesc}
                        onChange={(e) => handleInputChange("bestProjectDesc", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Availability & Commitment */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 shadow-2xs space-y-6">
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Step 03
                    </span>
                    <h2 className="text-xl font-medium text-zinc-900 dark:text-white mt-1">
                      Availability & Working Cadence
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Early stage flexibility is completely welcome (moonlighting, part-time, or full-time).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Weekly Commitment */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Weekly Time Capacity
                      </label>
                      <select
                        value={formData.availability}
                        onChange={(e) => handleInputChange("availability", e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all cursor-pointer"
                      >
                        <option value="Part-Time (10-20 hrs/week)">Part-Time (10-20 hrs/wk)</option>
                        <option value="Moonlighting (Evenings & Weekends)">Moonlighting (Evenings/Weekends)</option>
                        <option value="Full-Time (30-40+ hrs/week)">Full-Time (30-40+ hrs/wk)</option>
                        <option value="Flexible / Sprint-based">Flexible / Sprint-based</option>
                      </select>
                    </div>

                    {/* Earliest Start Date */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Earliest Start Date
                      </label>
                      <select
                        value={formData.startDate}
                        onChange={(e) => handleInputChange("startDate", e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all cursor-pointer"
                      >
                        <option value="Immediate">Immediate</option>
                        <option value="Within 1-2 Weeks">Within 1-2 Weeks</option>
                        <option value="Next Month">Next Month</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                    </div>

                    {/* Working Style */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Preferred Working Rhythm
                      </label>
                      <select
                        value={formData.workingStyle}
                        onChange={(e) => handleInputChange("workingStyle", e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all cursor-pointer"
                      >
                        <option value="Async-First with Weekly Sprints">Async-First & Weekly Sprints</option>
                        <option value="Daily Quick Syncs">Daily Quick Syncs</option>
                        <option value="Weekend Deep Work Sessions">Weekend Deep Work Sessions</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Role-Tailored Deep Dive Questions */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 shadow-2xs space-y-7">
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Step 04
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {formConfig?.badge || "Tailored Role Deep Dive"}
                      </span>
                    </div>
                    <h2 className="text-xl font-medium text-zinc-900 dark:text-white mt-1">
                      Role-Tailored Deep Dive
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Specific questions designed for the {selectedRoleData.title} position. Be authentic and specific.
                    </p>
                  </div>

                  {/* Dynamic Question 1 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-white">
                      {formConfig?.questions?.whyJoin?.title || "1. Why SmartNShine & why now?"} <span className="text-rose-500">*</span>
                    </label>
                    {formConfig?.questions?.whyJoin?.subtitle && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
                        {formConfig.questions.whyJoin.subtitle}
                      </p>
                    )}
                    <textarea
                      required
                      rows={4}
                      placeholder={formConfig?.questions?.whyJoin?.placeholder || "Share what caught your attention..."}
                      value={formData.whyJoin}
                      onChange={(e) => handleInputChange("whyJoin", e.target.value)}
                      className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all resize-y"
                    />
                  </div>

                  {/* Dynamic Question 2 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-white">
                      {formConfig?.questions?.scrappyStory?.title || "2. Tell us about a scrappy project you executed from scratch."}
                    </label>
                    {formConfig?.questions?.scrappyStory?.subtitle && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
                        {formConfig.questions.scrappyStory.subtitle}
                      </p>
                    )}
                    <textarea
                      rows={4}
                      placeholder={formConfig?.questions?.scrappyStory?.placeholder || "Something you created with pure hustle..."}
                      value={formData.scrappyStory}
                      onChange={(e) => handleInputChange("scrappyStory", e.target.value)}
                      className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all resize-y"
                    />
                  </div>

                  {/* Dynamic Question 3 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-white">
                      {formConfig?.questions?.first30DaysPlan?.title || "3. What are your top initiatives for your first 30 days?"}
                    </label>
                    {formConfig?.questions?.first30DaysPlan?.subtitle && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
                        {formConfig.questions.first30DaysPlan.subtitle}
                      </p>
                    )}
                    <textarea
                      rows={4}
                      placeholder={formConfig?.questions?.first30DaysPlan?.placeholder || "1. First initiative...\n2. Second initiative..."}
                      value={formData.first30DaysPlan}
                      onChange={(e) => handleInputChange("first30DaysPlan", e.target.value)}
                      className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all resize-y"
                    />
                  </div>

                  {/* Dynamic Question 4 (Specialized Role Question) */}
                  {formConfig?.questions?.roleSpecificQuestion && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-900 dark:text-white">
                        {formConfig.questions.roleSpecificQuestion.title}
                      </label>
                      {formConfig.questions.roleSpecificQuestion.subtitle && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
                          {formConfig.questions.roleSpecificQuestion.subtitle}
                        </p>
                      )}
                      <textarea
                        rows={4}
                        placeholder={formConfig.questions.roleSpecificQuestion.placeholder || "Your specialized answer..."}
                        value={formData.roleSpecificAnswer}
                        onChange={(e) => handleInputChange("roleSpecificAnswer", e.target.value)}
                        className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all resize-y"
                      />
                    </div>
                  )}

                  {/* Dynamic Question 5 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-white">
                      {formConfig?.questions?.marketInsight?.title || "5. What is one thing existing resume builders get completely wrong today?"}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={formConfig?.questions?.marketInsight?.placeholder || "Your perspective on what the market is missing..."}
                      value={formData.marketInsight}
                      onChange={(e) => handleInputChange("marketInsight", e.target.value)}
                      className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all resize-y"
                    />
                  </div>
                </div>

                {/* SECTION 5: Resume & Final Notes */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 shadow-2xs space-y-6">
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Step 05
                    </span>
                    <h2 className="text-xl font-medium text-zinc-900 dark:text-white mt-1">
                      Resume & Supporting Documents
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Upload your CV or attach any additional context.
                    </p>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileProcess(e.target.files[0])}
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                    />

                    {formData.resumeName ? (
                      <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                              {formData.resumeName}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {formData.resumeSize
                                ? `${(formData.resumeSize / 1024 / 1024).toFixed(2)} MB`
                                : "Attached"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(true);
                        }}
                        onDragLeave={() => setIsDraggingFile(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-8 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
                          isDraggingFile
                            ? "border-blue-500 bg-blue-500/5"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 bg-zinc-50/50 dark:bg-zinc-800/30"
                        }`}
                      >
                        <UploadCloud className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          Click to upload or drag & drop your Resume / CV
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          PDF, DOCX, or DOC (Max 8MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Anything else you'd like the founders to know? (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Any questions, links to recent tweets, or things we should know..."
                      value={formData.additionalNotes}
                      onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                      className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-all resize-y"
                    />
                  </div>
                </div>

                {/* Bottom Submit Actions */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Direct review by the technical founders within 48 hours.</span>
                  </p>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                      to="/careers"
                      className="px-6 py-3.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm font-medium transition-all text-center w-full sm:w-auto cursor-pointer"
                    >
                      Cancel
                    </Link>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3.5 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-medium transition-all shadow-md active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Application...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Founding Application</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
