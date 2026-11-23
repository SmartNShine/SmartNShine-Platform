import { useEffect, useMemo, useRef, useState, Component } from "react";
import { Eye, Palette } from "lucide-react";
import adaptPortfolioData from "../themes/adaptPortfolioData";
import { getPortfolioTheme } from "../themes/themeRegistry";

class PreviewErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Live preview error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function LivePreviewPane({ form, resume, projects }) {
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(0.28);
  const theme = getPortfolioTheme(form?.themeId || "smartnshine");
  const ThemeComponent = theme.component;
  const shouldBeDark = theme.defaultMode === "dark";

  useEffect(() => {
    if (!wrapperRef.current) return;

    const updateScale = () => {
      if (!wrapperRef.current) return;
      const width = wrapperRef.current.clientWidth;
      if (width) setScale(width / 1280);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const previewPortfolio = useMemo(
    () => ({
      ...(form || {}),
      themeId: form?.themeId || "smartnshine",
      themeAccent: form?.themeAccent || theme.accentPresets?.[0] || "",
    }),
    [form, theme]
  );

  const previewData = useMemo(() => {
    try {
      return adaptPortfolioData({
        portfolio: previewPortfolio,
        resume,
        projects,
        mode: "preview",
      });
    } catch (err) {
      console.warn("adaptPortfolioData failed for live preview:", err);
      return null;
    }
  }, [previewPortfolio, resume, projects]);

  const fallbackUI = (
    <div
      className={`w-full h-full min-h-[420px] flex flex-col items-center justify-center p-6 text-center ${
        shouldBeDark
          ? "bg-gradient-to-br from-zinc-900 to-zinc-950 text-white"
          : "bg-gradient-to-br from-stone-100 to-stone-200 text-stone-900"
      }`}
    >
      <Palette className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
      <span className="font-bold text-sm">{theme.name}</span>
      <span className="text-xs opacity-70 mt-1">Preview unavailable</span>
    </div>
  );

  return (
    <div className="rounded-3xl border border-gray-200/90 dark:border-white/[0.1] bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-zinc-200">
          <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Live preview
        </div>
        <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 capitalize truncate max-w-[140px]">
          {theme.name}
        </span>
      </div>
      <div className="p-3 bg-gray-50/80 dark:bg-zinc-900/40">
        <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-gray-200/80 dark:border-white/10 bg-white dark:bg-zinc-950">
          {!ThemeComponent || !previewData ? (
            fallbackUI
          ) : (
            <PreviewErrorBoundary fallback={fallbackUI}>
              <div
                className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${
                  shouldBeDark ? "bg-zinc-950" : "bg-stone-50"
                }`}
              >
                <div ref={wrapperRef} className="w-full h-full relative">
                  <div
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                      width: "1280px",
                      height: "800px",
                    }}
                    className={`absolute top-0 left-0 overflow-hidden pointer-events-none ${
                      shouldBeDark ? "bg-zinc-950" : "bg-stone-50"
                    }`}
                  >
                    <ThemeComponent
                      data={previewData}
                      portfolio={previewPortfolio}
                      resume={resume}
                      projects={projects}
                      mode="preview"
                      isDarkMode={shouldBeDark}
                      accentColor={previewPortfolio.themeAccent}
                    />
                  </div>
                </div>
              </div>
            </PreviewErrorBoundary>
          )}
        </div>
        <p className="mt-2 text-[11px] text-gray-500 dark:text-zinc-400 text-center">
          Updates as you edit. Use Preview for full desktop/mobile view.
        </p>
      </div>
    </div>
  );
}
