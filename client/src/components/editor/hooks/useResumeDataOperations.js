import { useCallback } from "react";
import { normalizeQrCode } from "../utils/qrCode";

/**
 * useResumeDataOperations - Custom hook encapsulating CRUD and reordering operations
 * on resume data fields and array items.
 */
export function useResumeDataOperations({ setResumeData, isReadOnlyResume }) {
  const updateField = useCallback(
    (field, value) => {
      if (isReadOnlyResume) return;
      setResumeData((prev) => {
        if (field.startsWith("qrCode.")) {
          const key = field.slice("qrCode.".length);
          if (!["url", "enabled", "imageDataUrl"].includes(key)) return prev;
          const qrCode = normalizeQrCode(prev?.qrCode);
          return {
            ...prev,
            qrCode: normalizeQrCode({
              ...qrCode,
              [key]: value,
              ...(key === "url" ? { imageDataUrl: "" } : {}),
            }),
          };
        }
        return {
          ...prev,
          [field]: field === "qrCode" ? normalizeQrCode(value) : value,
        };
      });
    },
    [isReadOnlyResume, setResumeData]
  );

  const updateContact = useCallback(
    (field, value) => {
      if (isReadOnlyResume) return;
      setResumeData((prev) => ({
        ...prev,
        contact: { ...(prev?.contact || {}), [field]: value },
      }));
    },
    [isReadOnlyResume, setResumeData]
  );

  const updateArrayItem = useCallback(
    (section, index, field, value) => {
      if (isReadOnlyResume) return;
      setResumeData((prev) => {
        const newArray = [...(prev?.[section] || [])];
        newArray[index] = { ...newArray[index], [field]: value };
        return { ...prev, [section]: newArray };
      });
    },
    [isReadOnlyResume, setResumeData]
  );

  const addArrayItem = useCallback(
    (section, template) => {
      if (isReadOnlyResume) return;
      setResumeData((prev) => ({
        ...prev,
        [section]: [...(prev?.[section] || []), template],
      }));
    },
    [isReadOnlyResume, setResumeData]
  );

  const removeArrayItem = useCallback(
    (section, index) => {
      if (isReadOnlyResume) return;
      setResumeData((prev) => ({
        ...prev,
        [section]: (prev?.[section] || []).filter((_, i) => i !== index),
      }));
    },
    [isReadOnlyResume, setResumeData]
  );

  const moveItem = useCallback(
    (section, fromIndex, toIndex) => {
      if (isReadOnlyResume) return;
      setResumeData((prev) => {
        const newArray = [...(prev?.[section] || [])];
        const [moved] = newArray.splice(fromIndex, 1);
        newArray.splice(toIndex, 0, moved);
        return { ...prev, [section]: newArray };
      });
    },
    [isReadOnlyResume, setResumeData]
  );

  return {
    updateField,
    updateContact,
    updateArrayItem,
    addArrayItem,
    removeArrayItem,
    moveItem,
  };
}

export default useResumeDataOperations;
