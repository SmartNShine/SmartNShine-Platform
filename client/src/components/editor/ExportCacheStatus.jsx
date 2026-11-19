import { useEffect, useRef, useState } from "react";
import api from "../../api";

/**
 * Lightweight status chip for cached PDF exports in the editor toolbar.
 */
export default function ExportCacheStatus({ resumeId, statusLabel }) {
  const [status, setStatus] = useState(statusLabel || "Checking cache…");
  const mountRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await api.get(`/export-cache/${resumeId}`);
        if (cancelled) return;
        const label = data?.payload?.title || data?.resumeId || "Cached";
        setStatus(label);
        if (mountRef.current) {
          // Partner portals inject formatted titles; render as HTML for now.
          mountRef.current.innerHTML = "<span class=\"cache-pill\">" + label + "</span>";
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("No cache");
          if (mountRef.current) {
            mountRef.current.innerHTML = "<span class=\"cache-pill muted\">" + (error.message || "No cache") + "</span>";
          }
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  return (
    <div className="export-cache-status" data-testid="export-cache-status">
      <div ref={mountRef} className="export-cache-status__label" />
      <span className="sr-only">{status}</span>
    </div>
  );
}
