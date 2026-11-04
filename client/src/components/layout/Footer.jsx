import { Link } from "react-router-dom";
import {
  Mail,
  Sparkles,
  ArrowUpRight,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { TextHoverEffect, FooterBackgroundGradient } from "@/components/ui/hover-footer";
import Logo from "@/components/common/Logo";

const Footer = () => {
  const productLinks = [
    { name: "ATS Resume Analyzer", path: "/ats-analyzer" },
    { name: "AI Resume Enhancer", path: "/upload" },
    { name: "Resume Templates (15+)", path: "/templates" },
    { name: "Career Profile Hub", path: "/career-profile" },
    { name: "Career Q&A Studio", path: "/career-qa" },
    { name: "Portfolios Builder (14+)", path: "/portfolio", pulse: true },
    { name: "Careers (We're Hiring!)", path: "/careers", pulse: true },
    { name: "Pricing & Plans", path: "/pricing" },
  ];

  const policyLinks = [
    { name: "Terms & Conditions", path: "/terms-and-conditions" },
    { name: "Privacy Policy", path: "/privacy-policy" },
    { name: "Refund Policy", path: "/refund-policy" },
    { name: "Shipping Policy", path: "/shipping-policy" },
  ];

  const socialLinks = [
    { icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn", href: "https://linkedin.com" },
    { icon: <Twitter className="w-4 h-4" />, label: "Twitter", href: "https://twitter.com" },
    { icon: <Github className="w-4 h-4" />, label: "GitHub", href: "https://github.com" },
    { icon: <Globe className="w-4 h-4" />, label: "Status", href: "#" },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 45 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full border-t border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#070709] transition-all duration-700 no-print overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-16 sm:pt-20 pb-6 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-14 pb-12">
          {/* Brand section matching Sidebar typography and colors */}
          <div className="lg:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 text-2xl sm:text-3xl font-normal tracking-tight group text-zinc-950 dark:text-white">
              <Logo
                className="w-9 h-9 object-contain group-hover:scale-105 transition-transform duration-200"
                alt="SmartNShine Logo"
              />
              <span className="leading-none">
                Smart<span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">N</span>Shine
              </span>
            </Link>

            <p className="text-sm sm:text-[15px] text-gray-600 dark:text-zinc-400 leading-relaxed max-w-md font-light">
              The AI career operating system engineered to diagnose ATS compatibility, enhance achievement bullets with real metrics, and deploy live portfolio websites.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-light border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All ATS Engines Operational
              </span>
            </div>
          </div>

          {/* Core Tools Column */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs sm:text-sm font-medium uppercase tracking-wider text-gray-900 dark:text-white">
              Core Platform
            </h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm sm:text-[15px] text-gray-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1.5 group font-light"
                  >
                    <span>{link.name}</span>
                    {link.pulse && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                    )}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Policies Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs sm:text-sm font-medium uppercase tracking-wider text-gray-900 dark:text-white">
              Legal & Security
            </h4>
            <ul className="space-y-3">
              {policyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm sm:text-[15px] text-gray-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-light block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact / Help Desk */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs sm:text-sm font-medium uppercase tracking-wider text-gray-900 dark:text-white">
              Support Desk
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/contact"
                  className="text-sm sm:text-[15px] text-gray-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-light inline-flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span>Contact Support</span>
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@smartnshine.in"
                  className="text-sm sm:text-[15px] text-gray-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-light inline-flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate">contact@smartnshine.in</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-t border-gray-200/70 dark:border-white/[0.08] my-6" />

        {/* Footer bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-gray-500 dark:text-zinc-400 gap-4 font-light">
          <div className="flex items-center space-x-3">
            {socialLinks.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800/80 border border-gray-200 dark:border-white/5 flex items-center justify-center text-gray-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 transition-all active:scale-95"
              >
                {icon}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 text-center sm:text-right">
            <span>© {new Date().getFullYear()} SmartNShine. Powered by Next-Gen AI.</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </div>

        {/* Large Animated Full-Width Vector Text Banner */}
        <div className="w-full pt-10 pb-2 overflow-hidden relative z-10 opacity-80 hover:opacity-100 transition-opacity">
          <TextHoverEffect text="SMARTNSHINE" />
        </div>
      </div>

      <FooterBackgroundGradient />
    </motion.footer>
  );
};

export default Footer;
