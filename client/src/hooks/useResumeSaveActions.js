import {useCallback, useState} from "react";
import toast from "react-hot-toast";
import {resumeAPI} from "@/api/api";
import {parseValidationErrors} from "@/utils/errorHandler";
import logger from "@/utils/logger";

export const useResumeSaveActions = ({
  user,
  navigate,
  resumeData,
  setResumeData,
  setOriginalResumeData,
  setUpgradeMessage,
  showUpgradeModalTrue,
}) => {
  const [saving, setSaving] = useState(false);

  const saveResume = useCallback(
    async ({
      dataToSave,
      showSuccessToast = true,
      showErrorToast = true,
      requireAuthRedirect = true,
      errorMessagePrefix = "Failed to save resume: ",
    } = {}) => {
      const targetResume = dataToSave || resumeData;

      if (!user) {
        if (requireAuthRedirect) {
          toast.error("Please login to save your resume", {
            duration: 3000,
          });
          navigate("/login");
        }
        return {ok: false};
      }

      if (!targetResume) {
        return {ok: false};
      }

      setSaving(true);

      try {
        // Sanitize skills to ensure valid format
        const cleanResume = { ...targetResume };
        
        // Provide safe defaults for name and title
        if (!cleanResume.name || typeof cleanResume.name !== "string" || !cleanResume.name.trim()) {
          cleanResume.name = user?.name || "Untitled Resume";
        } else {
          cleanResume.name = cleanResume.name.trim();
        }

        if (!cleanResume.resumeTitle || typeof cleanResume.resumeTitle !== "string" || !cleanResume.resumeTitle.trim()) {
          cleanResume.resumeTitle = cleanResume.title?.trim() || "Untitled Resume";
        } else {
          cleanResume.resumeTitle = cleanResume.resumeTitle.trim();
        }

        if (Array.isArray(cleanResume.skills)) {
          cleanResume.skills = cleanResume.skills
            .map((group) => {
              if (typeof group === "string") {
                return { category: "Technical Skills", items: [group.trim()].filter(Boolean) };
              }
              if (group && typeof group === "object") {
                const category = (group.category || group.name || "Technical Skills").trim();
                let items = group.items || group.skills || [];
                if (typeof items === "string") {
                  items = items
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                } else if (Array.isArray(items)) {
                  items = items
                    .flatMap((it) => (typeof it === "string" ? it.split(",") : String(it)))
                    .map((s) => s.trim())
                    .filter(Boolean);
                } else {
                  items = [];
                }
                return { category, items };
              }
              return null;
            })
            .filter((g) => g && (g.items.length > 0 || g.category));
        }

        console.log("💾 [SAVE RESUME] Sending to database. Custom sections payload:", cleanResume.customSections);
        const isUpdate = Boolean(
          cleanResume._id &&
            (typeof cleanResume._id !== "string" || cleanResume._id.trim() !== "")
        );
        if (!isUpdate) {
          delete cleanResume._id;
          delete cleanResume.id;
        }
        const response = isUpdate
          ? await resumeAPI.update(cleanResume._id, cleanResume)
          : await resumeAPI.save(cleanResume);

        const savedResume = response.data;
        console.log("✅ [SAVE RESUME] Received from database! Custom sections in MongoDB response:", savedResume?.customSections);

        if (savedResume && savedResume._id) {
          setResumeData(savedResume);
          localStorage.setItem("currentResumeId", savedResume._id);
          setOriginalResumeData(JSON.parse(JSON.stringify(savedResume)));

          // Synchronize window.history.state so React Router doesn't hold stale stateData
          if (window.history?.replaceState) {
            try {
              window.history.replaceState(
                {
                  ...window.history.state,
                  usr: {
                    ...(window.history.state?.usr || {}),
                    resumeData: savedResume,
                    isNewResume: false,
                  },
                },
                ""
              );
            } catch {
              // Ignore if serialization fails
            }
          }
        }

        if (showSuccessToast) {
          toast.success(
            isUpdate ? "Resume updated successfully!" : "Resume saved successfully!",
            {duration: 2500}
          );
        }

        return {ok: true, savedResume};
      } catch (err) {
        logger.error("Save error:", err);

        if (
          user.role !== "admin" &&
          err.response?.status === 403 &&
          (err.response?.data?.upgradeRequired || err.response?.data?.quotaExceeded)
        ) {
          const errorData = err.response.data;
          setUpgradeMessage(
            errorData.message ||
              "Upgrade required to access this premium feature!"
          );
          showUpgradeModalTrue();
        } else if (showErrorToast) {
          toast.error(errorMessagePrefix + parseValidationErrors(err), {
            duration: 4000,
          });
        }

        return {ok: false, error: err};
      } finally {
        setSaving(false);
      }
    },
    [
      user,
      navigate,
      resumeData,
      setResumeData,
      setOriginalResumeData,
      setUpgradeMessage,
      showUpgradeModalTrue,
    ]
  );

  const handleSave = useCallback(async () => {
    const result = await saveResume();
    return result.ok;
  }, [saveResume]);

  return {
    saving,
    saveResume,
    handleSave,
  };
};
