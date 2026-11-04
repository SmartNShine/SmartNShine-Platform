import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import SEO from "@/components/common/SEO";
import { resumeAPI } from "@/api/api";
import { parseValidationErrors } from "@/utils/errorHandler";
import UpgradeRequiredModal from "@/components/common/modals/UpgradeRequiredModal";
import { useToggle } from "@/hooks";
import {
  UploadBanner,
  UploadDropzone,
  UploadActionOptions,
  UploadWorkflowGuide,
  UploadSecurityNotice,
} from "@/components/upload";

export default function Upload() {
  const [uploading, , setUploadingTrue, setUploadingFalse] = useToggle(false);
  const [error, setError] = useState("");
  const [
    showUpgradeModal,
    ,
    setShowUpgradeModalTrue,
    setShowUpgradeModalFalse,
  ] = useToggle(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const navigate = useNavigate();

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError("");
    setUploadingTrue();

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await resumeAPI.upload(formData);

      // Navigate to editor with parsed data
      navigate("/editor", { state: { resumeData: response.data.data } });
    } catch (err) {
      console.error("Upload error:", err);

      // Check if it's a subscription/upgrade required error
      if (
        err.response?.data?.upgradeRequired ||
        err.response?.data?.quotaExceeded
      ) {
        setUpgradeMessage(
          err.response.data.message || "Upgrade to access this premium feature!"
        );
        setShowUpgradeModalTrue();
      } else {
        setError(parseValidationErrors(err));
      }
    } finally {
      setUploadingFalse();
    }
  };

  // Create blank resume and navigate to editor
  const createBlankResume = () => {
    const preSelectedTemplate =
      sessionStorage.getItem("templatePreSelected") ||
      localStorage.getItem("selectedTemplate");
    const hasPreSelected = Boolean(
      sessionStorage.getItem("templatePreSelected")
    );

    const blankResumeData = {
      name: "",
      contact: {
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        github: "",
        portfolio: "",
      },
      summary: "",
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      achievements: [],
      customSections: [],
    };

    navigate("/editor", {
      state: {
        resumeData: blankResumeData,
        isNewResume: true,
        templateSelected: hasPreSelected,
        selectedTemplate: preSelectedTemplate || undefined,
      },
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/msword": [".doc"],
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] text-gray-900 dark:text-zinc-100 transition-colors duration-200">
      <SEO
        title="Upload Your Resume - AI Enhancer | SmartNShine"
        description="Upload your existing resume to let our AI extract, categorize, and transform it into an ATS-optimized, recruiter-ready resume in seconds."
        keywords="upload resume, AI resume parser, convert resume to ATS, PDF resume extractor"
        url="https://www.smartnshine.in/upload"
      />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Hero Banner */}
        <UploadBanner />

        {/* Dropzone Card */}
        <UploadDropzone
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isDragActive={isDragActive}
          uploading={uploading}
          error={error}
        />

        {/* Alternative Action Triggers (Start from scratch, Use Career Profile) */}
        <UploadActionOptions
          onCreateBlank={createBlankResume}
          uploading={uploading}
        />

        {/* Workflow & Benefits Grid */}
        <UploadWorkflowGuide />

        {/* Privacy Notice */}
        <UploadSecurityNotice />
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeRequiredModal
          isOpen={showUpgradeModal}
          onClose={setShowUpgradeModalFalse}
          message={upgradeMessage}
          title="Upgrade Required"
          feature="AI Resume Parsing"
        />
      )}
    </div>
  );
}
