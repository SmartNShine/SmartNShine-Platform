import {useState, useEffect} from "react";
import {
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Headphones,
  Crown,
  Rocket,
  PenTool,
  X,
  ExternalLink,
  Laptop,
  Smartphone,
  Eye,
  Copy,
  Check,
  FileText,
  Palette,
  Layers,
  HelpCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import {sendCustomAdminEmail} from "@/api/admin.api";

// Theme Palette Definitions
const THEME_PALETTES = {
  indigo: {
    id: "indigo",
    label: "Indigo Modern",
    primary: "#4f46e5",
    headerGrad: "from-slate-900 via-indigo-950 to-slate-900",
    badgeBg: "bg-indigo-500/15",
    badgeBorder: "border-indigo-500/30",
    badgeText: "text-indigo-300",
    cardBg: "bg-indigo-50/70",
    cardBorder: "border-indigo-100",
    cardTitle: "text-indigo-900",
    cardText: "text-indigo-800",
    btnBg: "bg-indigo-600 hover:bg-indigo-700 text-white",
    noteBorder: "border-indigo-500",
    accentDot: "bg-indigo-500",
  },
  emerald: {
    id: "emerald",
    label: "Emerald Success",
    primary: "#059669",
    headerGrad: "from-slate-900 via-emerald-950 to-slate-900",
    badgeBg: "bg-emerald-500/15",
    badgeBorder: "border-emerald-500/30",
    badgeText: "text-emerald-300",
    cardBg: "bg-emerald-50/70",
    cardBorder: "border-emerald-100",
    cardTitle: "text-emerald-900",
    cardText: "text-emerald-800",
    btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
    noteBorder: "border-emerald-500",
    accentDot: "bg-emerald-500",
  },
  blue: {
    id: "blue",
    label: "Blue Support",
    primary: "#2563eb",
    headerGrad: "from-slate-900 via-blue-950 to-slate-900",
    badgeBg: "bg-blue-500/15",
    badgeBorder: "border-blue-500/30",
    badgeText: "text-blue-300",
    cardBg: "bg-blue-50/70",
    cardBorder: "border-blue-100",
    cardTitle: "text-blue-900",
    cardText: "text-blue-800",
    btnBg: "bg-blue-600 hover:bg-blue-700 text-white",
    noteBorder: "border-blue-500",
    accentDot: "bg-blue-500",
  },
  violet: {
    id: "violet",
    label: "Violet Premium",
    primary: "#7c3aed",
    headerGrad: "from-slate-900 via-purple-950 to-slate-900",
    badgeBg: "bg-purple-500/15",
    badgeBorder: "border-purple-500/30",
    badgeText: "text-purple-300",
    cardBg: "bg-purple-50/70",
    cardBorder: "border-purple-100",
    cardTitle: "text-purple-900",
    cardText: "text-purple-800",
    btnBg: "bg-purple-600 hover:bg-purple-700 text-white",
    noteBorder: "border-purple-500",
    accentDot: "bg-purple-500",
  },
  amber: {
    id: "amber",
    label: "Amber Notice",
    primary: "#d97706",
    headerGrad: "from-slate-900 via-amber-950 to-slate-900",
    badgeBg: "bg-amber-500/15",
    badgeBorder: "border-amber-500/30",
    badgeText: "text-amber-300",
    cardBg: "bg-amber-50/70",
    cardBorder: "border-amber-100",
    cardTitle: "text-amber-900",
    cardText: "text-amber-800",
    btnBg: "bg-amber-600 hover:bg-amber-700 text-white",
    noteBorder: "border-amber-500",
    accentDot: "bg-amber-500",
  },
  slate: {
    id: "slate",
    label: "Slate Executive",
    primary: "#475569",
    headerGrad: "from-slate-900 via-slate-800 to-slate-900",
    badgeBg: "bg-slate-500/15",
    badgeBorder: "border-slate-500/30",
    badgeText: "text-slate-300",
    cardBg: "bg-slate-100/70",
    cardBorder: "border-slate-200",
    cardTitle: "text-slate-900",
    cardText: "text-slate-700",
    btnBg: "bg-slate-800 hover:bg-slate-900 text-white",
    noteBorder: "border-slate-400",
    accentDot: "bg-slate-400",
  },
};

// Built-in Professional SaaS Email Templates
const EMAIL_TEMPLATES = [
  {
    id: "service_resolution",
    name: "Service & Maintenance Update",
    category: "Operations",
    icon: ShieldCheck,
    themeAccent: "emerald",
    subject: "Update: Platform Maintenance Completed & Workspace Fully Operational",
    badgeText: "PLATFORM NOTICE",
    heading: "System Optimizations & Performance Update",
    bodyMessage:
      "Hello {name},\n\nWe recently completed scheduled system maintenance and infrastructure performance upgrades across the SmartNShine platform.\n\nAll services—including the ATS Resume Scanner, Document Formatting Engine, and Career Workspace—are operating with enhanced speed, reliability, and precision. We sincerely appreciate your patience while these updates were deployed.",
    cardTitle: "Key Platform Enhancements",
    cardMessage:
      "• Increased ATS parsing speed and scoring accuracy\n• Streamlined multi-format PDF and Word export fidelity\n• Improved infrastructure response times for all workspace tools",
    buttonText: "Open Your Workspace",
    buttonUrl: "https://smartnshine.in/dashboard",
    noteBox:
      "📩 If you have any questions or require assistance, please reply directly to this email or visit our Support Center.",
  },
  {
    id: "customer_support",
    name: "Customer Care & Follow-Up",
    category: "Support",
    icon: Headphones,
    themeAccent: "blue",
    subject: "Following up on your SmartNShine workspace & inquiry",
    badgeText: "CUSTOMER SUPPORT",
    heading: "Checking In On Your Experience",
    bodyMessage:
      "Hello {name},\n\nThank you for choosing SmartNShine for your career development needs. We are following up regarding your recent workspace activity to ensure you have everything required to optimize and polish your professional materials.\n\nWhether you need assistance fine-tuning your resume formatting, navigating ATS keyword metrics, or customizing sections, our support specialists are here to help.",
    cardTitle: "How We Can Assist You",
    cardMessage:
      "• Priority support review for resume formatting and scoring\n• Guidance on recruiter-tested keywords and industry metrics\n• Direct assistance with account settings and document exports",
    buttonText: "Visit Support Center",
    buttonUrl: "https://smartnshine.in/contact",
    noteBox:
      "💡 You can simply reply directly to this email to get in touch with our customer care team anytime.",
  },
  {
    id: "pro_upgrade",
    name: "Exclusive Pro Membership Offer",
    category: "Promotion",
    icon: Crown,
    themeAccent: "indigo",
    subject: "Exclusive Member Invitation: Elevate Your Job Search with SmartNShine Pro",
    badgeText: "EXCLUSIVE INVITATION",
    heading: "Unlock Complete Access to SmartNShine Pro",
    bodyMessage:
      "Hello {name},\n\nTo help you accelerate your job search and stand out to hiring managers, we are pleased to extend an exclusive preferred upgrade to the SmartNShine Pro Suite.\n\nGain full access to comprehensive ATS compatibility reports, recruiter-certified resume templates, real-time interview practice simulations, and your own live public portfolio website.",
    cardTitle: "Pro Suite Membership Privileges",
    cardMessage:
      "• Unlimited in-depth ATS scans and keyword density analysis\n• Full access to all 11 modern, recruiter-approved resume layouts\n• Interactive interview preparation simulations with instant scoring\n• 1-Click live public portfolio website with custom sharing link",
    buttonText: "Explore Pro Benefits",
    buttonUrl: "https://smartnshine.in/pricing",
    noteBox:
      "✨ Preferred pricing is available for a limited time. Cancel or adjust your subscription preferences anytime.",
  },
  {
    id: "security_notice",
    name: "Account Security & Notice",
    category: "Security",
    icon: ShieldAlert,
    themeAccent: "amber",
    subject: "Important Account Notice & Security Advisory - SmartNShine",
    badgeText: "SECURITY NOTICE",
    heading: "Important Account Security Advisory",
    bodyMessage:
      "Hello {name},\n\nWe are writing to provide an important update regarding your SmartNShine account security and session management.\n\nTo ensure your career documents and account details remain safe, we recommend periodically reviewing your profile information and active devices.",
    cardTitle: "Recommended Security Best Practices",
    cardMessage:
      "• Verify your registered email address and contact preferences\n• Ensure your account is secured with a strong, unique password\n• Review your active workspace sessions and authorized integrations",
    buttonText: "Review Account Security",
    buttonUrl: "https://smartnshine.in/dashboard/profile",
    noteBox:
      "🔒 If you did not make changes to your account or notice unfamiliar activity, please contact our security team immediately.",
  },
  {
    id: "feature_release",
    name: "New Features & Release Notes",
    category: "Product",
    icon: Rocket,
    themeAccent: "violet",
    subject: "What's New in SmartNShine: Modern Layouts & Precision Insights",
    badgeText: "PRODUCT RELEASE",
    heading: "Introducing New Tools for Your Job Search",
    bodyMessage:
      "Hello {name},\n\nWe are excited to share new platform improvements and feature enhancements now live in your SmartNShine workspace.\n\nWe have expanded our resume template gallery, upgraded our export formatting fidelity, and added new diagnostic tools designed to help you craft compelling job applications faster.",
    cardTitle: "Release Highlights",
    cardMessage:
      "• Fresh modern resume designs tailored for engineering, business, and creative fields\n• High-fidelity PDF rendering with zero layout discrepancies\n• Real-time score breakdown with actionable keyword improvement suggestions",
    buttonText: "Explore New Features",
    buttonUrl: "https://smartnshine.in/dashboard",
    noteBox:
      "🚀 All new features are available immediately in your dashboard with no extra configuration needed.",
  },
  {
    id: "custom_blank",
    name: "Custom Official Communication",
    category: "Custom",
    icon: PenTool,
    themeAccent: "slate",
    subject: "Communication from the SmartNShine Team",
    badgeText: "OFFICIAL NOTICE",
    heading: "Message Regarding Your SmartNShine Account",
    bodyMessage:
      "Hello {name},\n\nWe are reaching out regarding your SmartNShine account and workspace.\n\nPlease find the details of our communication below.",
    cardTitle: "",
    cardMessage: "",
    buttonText: "Visit SmartNShine",
    buttonUrl: "https://smartnshine.in",
    noteBox: "If you have any questions, feel free to reply directly to this email.",
  },
];

export default function AdminEmailModal({
  isOpen,
  onClose,
  initialEmail = "",
  initialName = "",
}) {
  const [selectedTemplate, setSelectedTemplate] = useState("service_resolution");
  const [themeAccent, setThemeAccent] = useState("emerald");
  const [activeTab, setActiveTab] = useState("message"); // 'message' | 'action' | 'styling'

  // Form State
  const [toEmail, setToEmail] = useState(initialEmail);
  const [userName, setUserName] = useState(initialName);
  const [subject, setSubject] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [heading, setHeading] = useState("");
  const [bodyMessage, setBodyMessage] = useState("");
  const [cardTitle, setCardTitle] = useState("");
  const [cardMessage, setCardMessage] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [noteBox, setNoteBox] = useState("");
  const [sendCopyAdmin, setSendCopyAdmin] = useState(true);

  // Modal UI State
  const [isSending, setIsSending] = useState(false);
  const [isTestSending, setIsTestSending] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("desktop"); // 'desktop' | 'mobile'
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Apply selected template
  const applyTemplate = (tplId) => {
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setSelectedTemplate(tplId);
    setThemeAccent(tpl.themeAccent || "indigo");
    setSubject(tpl.subject);
    setBadgeText(tpl.badgeText);
    setHeading(tpl.heading);
    setBodyMessage(tpl.bodyMessage);
    setCardTitle(tpl.cardTitle);
    setCardMessage(tpl.cardMessage);
    setButtonText(tpl.buttonText);
    setButtonUrl(tpl.buttonUrl);
    setNoteBox(tpl.noteBox);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialEmail) setToEmail(initialEmail);
      if (initialName) setUserName(initialName);
      applyTemplate(selectedTemplate);
    }
  }, [isOpen, initialEmail, initialName]);

  // Lock background scrolling on html and body when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Prevent layout shift from scrollbar disappearance
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSending && !isTestSending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSending, isTestSending, onClose]);

  if (!isOpen) return null;

  // Variable replacement helper for preview
  const formatPreview = (text) =>
    (text || "")
      .replace(/{name}/g, userName || "Valued Member")
      .replace(/{email}/g, toEmail || "user@example.com")
      .replace(/{app_url}/g, "https://smartnshine.in");

  // Insert variable into message textarea
  const insertVariable = (variableStr) => {
    setBodyMessage((prev) => `${prev} ${variableStr} `);
  };

  // Preset destination URL helper
  const applyUrlPreset = (url, label) => {
    setButtonUrl(url);
    if (!buttonText) setButtonText(label);
  };

  const handleSend = async (e, isTest = false) => {
    if (e) e.preventDefault();
    const destinationEmail = isTest ? "atharvsjoshi2005@gmail.com" : toEmail;

    if (!destinationEmail || !destinationEmail.includes("@")) {
      toast.error("Please enter a valid recipient email address");
      return;
    }
    if (!subject.trim() || !bodyMessage.trim()) {
      toast.error("Email Subject and Message Body are required");
      return;
    }

    try {
      if (isTest) setIsTestSending(true);
      else setIsSending(true);

      const res = await sendCustomAdminEmail({
        toEmail: destinationEmail,
        userName: isTest ? "Admin Test" : userName,
        subject,
        badgeText,
        heading,
        bodyMessage,
        cardTitle,
        cardMessage,
        buttonText,
        buttonUrl,
        noteBox,
        themeAccent,
        sendCopyAdmin: isTest ? false : sendCopyAdmin,
      });

      if (res.data?.success) {
        toast.success(
          isTest
            ? `Test email sent to ${destinationEmail}!`
            : `Email successfully delivered to ${destinationEmail}!`
        );
        if (!isTest) onClose();
      }
    } catch (err) {
      console.error("Failed to send email:", err);
      toast.error(err.response?.data?.message || "Failed to deliver email");
    } finally {
      setIsSending(false);
      setIsTestSending(false);
    }
  };

  const currentTheme = THEME_PALETTES[themeAccent] || THEME_PALETTES.indigo;

  // Copy raw HTML preview
  const handleCopyRawHtml = () => {
    const htmlString = `<!-- SmartNShine Branded Email -->\n<h2>${formatPreview(heading)}</h2>\n<p>${formatPreview(bodyMessage).replace(/\n/g, "<br>")}</p>`;
    navigator.clipboard.writeText(htmlString);
    setCopiedHtml(true);
    toast.success("Email snippet copied to clipboard");
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-[2px] overscroll-contain animate-in fade-in duration-150"
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSending && !isTestSending) {
          onClose();
        }
      }}
    >
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 ring-1 ring-white/10">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Admin Email Dispatcher
                </h2>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                  Live Preview Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Select a professional template, customize message parameters, and dispatch branded emails.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => handleSend(e, true)}
              disabled={isTestSending || isSending}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Send an immediate preview to your configured admin address"
            >
              <Send className={`w-3 h-3 ${isTestSending ? "animate-spin text-indigo-400" : ""}`} />
              <span className="hidden md:inline">Send Test to Me</span>
              <span className="md:hidden">Test</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body - 2 Columns (Editor & Preview) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Editor Controls (6 cols) */}
          <div className="lg:col-span-6 p-4 sm:p-5 overflow-y-auto space-y-4 border-r border-slate-800/80 max-h-[calc(94vh-130px)] custom-scrollbar">
            
            {/* Template Selector Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Select Business Template
                </label>
                <span className="text-[11px] text-slate-500">6 Professional Presets</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EMAIL_TEMPLATES.map((tpl) => {
                  const Icon = tpl.icon;
                  const isSelected = selectedTemplate === tpl.id;
                  const palette = THEME_PALETTES[tpl.themeAccent || "indigo"];
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between h-[72px] ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-950/40 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50"
                          : "border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? "bg-indigo-500 text-white shadow-sm"
                              : "bg-slate-700/60 text-slate-300"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                          {tpl.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold leading-tight line-clamp-1">
                        {tpl.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("message")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === "message"
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Message & Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("action")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === "action"
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Callout & Action
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("styling")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === "styling"
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                Theme & Options
              </button>
            </div>

            {/* TAB 1: Message & Recipient */}
            {activeTab === "message" && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {/* Recipient Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Recipient Email *
                    </label>
                    <input
                      type="email"
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Atharva Joshi"
                      className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Subject & Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Email Subject *
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter subject line..."
                      className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Header Badge Pill
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="e.g. UPDATE"
                      className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500 uppercase"
                    />
                  </div>
                </div>

                {/* Main Headline */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Main Headline Title
                  </label>
                  <input
                    type="text"
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    placeholder="Enter main headline title..."
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                  />
                </div>

                {/* Body Message */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      Body Message Content *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Insert tag:</span>
                      <button
                        type="button"
                        onClick={() => insertVariable("{name}")}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-indigo-300 font-mono"
                      >
                        +&#123;name&#125;
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable("{email}")}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-indigo-300 font-mono"
                      >
                        +&#123;email&#125;
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    value={bodyMessage}
                    onChange={(e) => setBodyMessage(e.target.value)}
                    placeholder="Write your email body here. Double line breaks create separate paragraphs..."
                    className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500 resize-y"
                    required
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Highlight Card & Action */}
            {activeTab === "action" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Highlight Card Box */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Highlight Summary Box (Optional)
                    </label>
                    <span className="text-[10px] text-slate-500">Rendered as callout card</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={cardTitle}
                      onChange={(e) => setCardTitle(e.target.value)}
                      placeholder="Callout Header (e.g. Key Improvements)"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <textarea
                      rows={3}
                      value={cardMessage}
                      onChange={(e) => setCardMessage(e.target.value)}
                      placeholder="Bullet points or summary details (e.g. • Fast parsing &#10;• Accuracy score)..."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 resize-y"
                    />
                  </div>
                </div>

                {/* CTA Button Setup */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                    Call to Action (CTA) Button
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="e.g. Go to Workspace"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Destination URL
                      </label>
                      <input
                        type="url"
                        value={buttonUrl}
                        onChange={(e) => setButtonUrl(e.target.value)}
                        placeholder="https://smartnshine.in/..."
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Quick URL Presets */}
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1.5">Quick Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyUrlPreset("https://smartnshine.in/dashboard", "Open Dashboard")}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700/60 transition-colors"
                      >
                        /dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => applyUrlPreset("https://smartnshine.in/pricing", "View Pro Pricing")}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700/60 transition-colors"
                      >
                        /pricing
                      </button>
                      <button
                        type="button"
                        onClick={() => applyUrlPreset("https://smartnshine.in/contact", "Contact Support")}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700/60 transition-colors"
                      >
                        /contact
                      </button>
                      <button
                        type="button"
                        onClick={() => applyUrlPreset("https://smartnshine.in/dashboard/profile", "Review Account")}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700/60 transition-colors"
                      >
                        /profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Theme Styling & Footer Settings */}
            {activeTab === "styling" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Theme Palette Chooser */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-400" />
                    Email Color Theme Accent
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Controls the header gradient, badge pill, highlight borders, and CTA button colors.
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(THEME_PALETTES).map((pal) => (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => setThemeAccent(pal.id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          themeAccent === pal.id
                            ? "border-indigo-500 bg-indigo-950/50 text-white ring-1 ring-indigo-500/50"
                            : "border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{backgroundColor: pal.primary}}
                        />
                        <span className="text-[11px] font-medium truncate">{pal.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer Note Box */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Footer Note / Support Advisory (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={noteBox}
                    onChange={(e) => setNoteBox(e.target.value)}
                    placeholder="Enter custom support or notice text to display at the bottom of the email..."
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 resize-y"
                  />
                </div>

                {/* Admin Verification Copy */}
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendCopyAdmin}
                      onChange={(e) => setSendCopyAdmin(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-700"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-200 block">
                        Receive BCC Copy to Admin Inbox
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Sends a discreet BCC copy to <code className="text-indigo-300">atharvsjoshi2005@gmail.com</code> for delivery verification.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: High-End Email Client Live Preview (6 cols) */}
          <div className="lg:col-span-6 bg-slate-950 p-4 sm:p-5 flex flex-col justify-between max-h-[calc(94vh-130px)] overflow-hidden">
            
            {/* Preview Control Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Real-Time Inbox Preview</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyRawHtml}
                  className="px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-lg transition-colors flex items-center gap-1"
                  title="Copy preview text to clipboard"
                >
                  {copiedHtml ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHtml ? "Copied" : "Copy"}</span>
                </button>

                <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors ${
                      previewDevice === "desktop"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Laptop className="w-3 h-3" /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors ${
                      previewDevice === "mobile"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Smartphone className="w-3 h-3" /> Mobile
                  </button>
                </div>
              </div>
            </div>

            {/* Email Client Simulated Window */}
            <div className="flex-1 overflow-y-auto py-3 flex justify-center custom-scrollbar">
              <div
                className={`bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col transition-all text-left ${
                  previewDevice === "mobile" ? "w-[340px]" : "w-full max-w-[510px]"
                }`}
              >
                {/* Email Client Window Bar (Mac style) */}
                <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                  </div>
                  <div className="text-slate-400 truncate max-w-[220px] font-mono text-[10px]">
                    {subject || "No Subject"}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Just now</span>
                  </div>
                </div>

                {/* Email Metadata Header */}
                <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">From:</span>
                    <span className="font-semibold text-slate-200">
                      SmartNShine Support &lt;contact@smartnshine.in&gt;
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">To:</span>
                    <span className="text-indigo-300 font-medium">
                      {toEmail || "recipient@example.com"}
                    </span>
                  </div>
                </div>

                {/* ACTUAL EMAIL CANVAS CONTAINER */}
                <div className="bg-white text-slate-800 flex-1 flex flex-col">
                  
                  {/* Brand Navigation Bar */}
                  <div className="bg-slate-950 px-5 py-3 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-1.5 font-extrabold text-sm tracking-tight text-white">
                      <span>⚡ Smart</span>
                      <span className="text-sky-400">N</span>
                      <span>Shine</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Official Notice
                    </span>
                  </div>

                  {/* Header Banner with Dynamic Gradient */}
                  <div
                    className={`bg-gradient-to-br ${currentTheme.headerGrad} text-white p-6 text-center transition-all`}
                  >
                    {badgeText && (
                      <div
                        className={`inline-block px-3 py-1 ${currentTheme.badgeBg} border ${currentTheme.badgeBorder} ${currentTheme.badgeText} rounded-full text-[10px] font-bold tracking-wider uppercase mb-2.5`}
                      >
                        {formatPreview(badgeText)}
                      </div>
                    )}
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-tight m-0 text-white leading-snug">
                      {formatPreview(heading) || "Important Update Regarding Your Account"}
                    </h2>
                  </div>

                  {/* Email Body Content */}
                  <div className="p-5 sm:p-6 space-y-4 text-xs leading-relaxed">
                    <p className="font-bold text-slate-900 text-sm m-0">
                      Hello {userName || "Valued Member"},
                    </p>

                    <div className="text-slate-700 whitespace-pre-line space-y-2.5">
                      {formatPreview(bodyMessage)}
                    </div>

                    {/* Highlight Box Callout */}
                    {(cardTitle || cardMessage) && (
                      <div
                        className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-xl p-4 transition-all my-3`}
                      >
                        {cardTitle && (
                          <h4 className={`font-bold ${currentTheme.cardTitle} text-xs mb-1.5 m-0`}>
                            {formatPreview(cardTitle)}
                          </h4>
                        )}
                        {cardMessage && (
                          <p className={`text-[11px] ${currentTheme.cardText} whitespace-pre-line leading-relaxed m-0`}>
                            {formatPreview(cardMessage)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* CTA Button */}
                    {buttonText && (
                      <div className="text-center py-2.5">
                        <div
                          className={`inline-flex items-center gap-1.5 px-6 py-2.5 font-bold rounded-xl shadow-md text-xs transition-all ${currentTheme.btnBg}`}
                        >
                          <span>{formatPreview(buttonText)}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}

                    {/* Footer Support Note Box */}
                    {noteBox && (
                      <div
                        className={`bg-slate-50 border-l-4 ${currentTheme.noteBorder} p-3 rounded-r-lg text-[11px] text-slate-600 leading-relaxed`}
                      >
                        {formatPreview(noteBox)}
                      </div>
                    )}

                    {/* Signoff */}
                    <div className="pt-3 text-[11px] text-slate-500 border-t border-slate-100">
                      Best regards,<br />
                      <strong className="text-slate-900 font-semibold text-xs">The SmartNShine Team</strong><br />
                      <span className="text-[10px] text-slate-400">Career Accelerator & ATS Optimization Platform</span>
                    </div>
                  </div>

                  {/* Email Footer Bar */}
                  <div className="bg-slate-50 p-3.5 text-center border-t border-slate-200 text-[10px] text-slate-400 space-y-0.5">
                    <p className="m-0 font-medium text-slate-600">
                      SmartNShine &bull; Modern Career & ATS Solutions
                    </p>
                    <p className="m-0 text-[9px] text-slate-400">
                      &copy; {new Date().getFullYear()} SmartNShine. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Meta Bar */}
            <div className="text-[11px] text-slate-400 pt-2.5 border-t border-slate-800 flex items-center justify-between">
              <span className="truncate max-w-[200px]">
                To: <span className="text-slate-200 font-mono">{toEmail || "Not specified"}</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                <CheckCircle2 className="w-3 h-3" /> Ready to Dispatch
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/80 gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              SMTP Connected: <span className="text-slate-300 font-mono">atharvsjoshi2005@gmail.com</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSend(e, false)}
              disabled={isSending || isTestSending}
              className="px-6 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSending ? "animate-spin" : ""}`} />
              <span>{isSending ? "Delivering..." : "Send Email Now"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
