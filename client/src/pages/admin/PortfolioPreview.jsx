import { Component, useEffect, useState } from "react";
import PortfolioThemeRenderer from "@/components/portfolio/PortfolioThemeRenderer";
import { portfolioThemes } from "@/components/portfolio/themes/themeRegistry";

// The boundary belongs inside the frame: parent boundaries cannot catch iframe errors.
class PreviewErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Portfolio Preview Boundary Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="p-8 text-center text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20">
          <p className="font-bold">Failed to load live preview</p>
          <p className="text-xs text-red-400 mt-1">{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminPortfolioPreview() {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (window.parent === window) return;

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin || event.source !== window.parent ||
          event.data?.type !== "admin-portfolio-preview:update") return;

      const payload = event.data.payload;
      if (!Object.hasOwn(portfolioThemes, payload?.portfolio?.themeId) ||
          !payload?.resume || !["light", "dark"].includes(payload.customThemeMode)) return;

      setPreview(payload);
    };

    window.addEventListener("message", handleMessage);
    // Handshake after mounting, including when route loading/auth outlasts iframe onLoad.
    window.parent.postMessage({ type: "admin-portfolio-preview:ready" }, window.location.origin);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <>
      <style>{`
        html, body, #root { margin: 0; width: 100%; min-height: 100%; }
      `}</style>
      {preview ? (
        <PreviewErrorBoundary key={preview.portfolio.themeId}>
          <PortfolioThemeRenderer
            portfolio={preview.portfolio}
            resume={preview.resume}
            mode="preview"
            customThemeMode={preview.customThemeMode}
            onThemeModeChange={(mode) => window.parent.postMessage({
              type: "admin-portfolio-preview:mode",
              mode,
            }, window.location.origin)}
          />
        </PreviewErrorBoundary>
      ) : (
        <p role="status" className="p-8 text-center text-gray-500">Waiting for simulator preview…</p>
      )}
    </>
  );
}
