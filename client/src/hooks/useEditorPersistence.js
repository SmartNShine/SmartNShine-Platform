import {useCallback, useEffect, useState} from "react";
import toast from "react-hot-toast";
import {resumeAPI} from "@/api/api";
import logger from "@/utils/logger";
import {useNavigationBlocker} from "@/context/NavigationBlockerContext";

export const useEditorPersistence = ({
  resumeData,
  originalResumeData,
  setResumeData,
  setOriginalResumeData,
  user,
  saving,
  locationState,
}) => {
  const {blockNavigation, unblockNavigation} = useNavigationBlocker();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);

  useEffect(() => {
    if (!resumeData || !originalResumeData) return;

    const hasChanges =
      JSON.stringify(resumeData) !== JSON.stringify(originalResumeData);
    setHasUnsavedChanges(hasChanges);
  }, [resumeData, originalResumeData]);

  useEffect(() => {
    if (hasUnsavedChanges) {
      blockNavigation((to) => {
        setShowUnsavedModal(true);
        setPendingNavigation(to);
        return false;
      });
    } else {
      unblockNavigation();
    }

    return () => {
      unblockNavigation();
    };
  }, [hasUnsavedChanges, blockNavigation, unblockNavigation]);


  useEffect(() => {
    if (!hasUnsavedChanges || !resumeData?._id || saving || autoSaving || !user) {
      return;
    }

    const autoSaveTimer = setTimeout(async () => {
      setAutoSaving(true);

      try {
        console.log("💾 [AUTO-SAVE] Triggering auto-save to MongoDB with customSections:", resumeData?.customSections);
        const response = await resumeAPI.update(resumeData._id, resumeData);
        const savedResume = response.data;
        console.log("✅ [AUTO-SAVE] MongoDB update successful! customSections in DB:", savedResume?.customSections);

        setResumeData(savedResume);
        setOriginalResumeData(JSON.parse(JSON.stringify(savedResume)));
        setHasUnsavedChanges(false);

        if (window.history?.replaceState) {
          try {
            window.history.replaceState(
              {
                ...window.history.state,
                usr: {
                  ...(window.history.state?.usr || {}),
                  resumeData: savedResume,
                },
              },
              ""
            );
          } catch {
            // Ignore
          }
        }

        toast.success("Auto-saved", {
          duration: 2000,
          position: "bottom-right",
          style: {
            background: "#10b981",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "500",
          },
        });
      } catch (error) {
        logger.error("❌ Auto-save failed:", error);
      } finally {
        setAutoSaving(false);
      }
    }, 30000);

    return () => {
      clearTimeout(autoSaveTimer);
    };
  }, [
    hasUnsavedChanges,
    resumeData,
    saving,
    autoSaving,
    user,
    setResumeData,
    setOriginalResumeData,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const markChangesSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  const commitPendingNavigation = useCallback(
    (navigateFn) => {
      unblockNavigation();
      setHasUnsavedChanges(false);

      if (pendingNavigation === "back") {
        if (locationState?.fromTemplates) {
          navigateFn("/templates");
        } else if (locationState?.fromDashboard) {
          navigateFn("/dashboard");
        } else if (locationState?.fromUpload) {
          navigateFn("/upload");
        } else if (locationState?.fromATS) {
          navigateFn("/ats-analyzer");
        } else if (window.history.length > 1 && window.history.state && window.history.state.idx > 0) {
          navigateFn(-1);
        } else {
          navigateFn("/dashboard");
        }
      } else if (pendingNavigation) {
        navigateFn(pendingNavigation);
      }

      setShowUnsavedModal(false);
      setPendingNavigation(null);
    },
    [pendingNavigation, unblockNavigation, locationState]
  );

  const cancelPendingNavigation = useCallback(() => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  }, []);

  return {
    hasUnsavedChanges,
    autoSaving,
    showUnsavedModal,
    setShowUnsavedModal,
    pendingNavigation,
    setPendingNavigation,
    markChangesSaved,
    commitPendingNavigation,
    cancelPendingNavigation,
  };
};

