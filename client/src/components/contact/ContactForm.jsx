import {
  Send,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  User,
  Mail,
  Phone,
  Building,
  Wrench,
  Loader2,
} from "lucide-react";

export function ContactForm({
  formData,
  handleChange,
  handleSubmit,
  status,
  errors,
  categories,
}) {
  return (
    <div className="bg-white dark:bg-zinc-900/90 rounded-3xl p-6 sm:p-8 border border-gray-200/90 dark:border-white/[0.08] shadow-sm space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Send Us a Message
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
          Fill out the details below and we will respond directly via email.
        </p>
      </div>

      {status.success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Message sent successfully! We will get back to you shortly.</span>
        </div>
      )}

      {status.error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{status.error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
              Your Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Atharva Joshi"
                className={`w-full px-4 py-3.5 pl-11 rounded-2xl border bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                  errors.name ? "border-rose-500" : "border-gray-200 dark:border-white/10"
                }`}
              />
              <User className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            {errors.name && <p className="text-xs text-rose-500 font-semibold">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className={`w-full px-4 py-3.5 pl-11 rounded-2xl border bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                  errors.email ? "border-rose-500" : "border-gray-200 dark:border-white/10"
                }`}
              />
              <Mail className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            {errors.email && <p className="text-xs text-rose-500 font-semibold">{errors.email}</p>}
          </div>
        </div>

        {/* Phone & Company (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
              Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3.5 pl-11 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
              <Phone className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
              Company / University <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Google / Stanford"
                className="w-full px-4 py-3.5 pl-11 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
              <Building className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
            Inquiry Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
            Subject <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="How can we help you?"
            className={`w-full px-4 py-3.5 rounded-2xl border bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
              errors.subject ? "border-rose-500" : "border-gray-200 dark:border-white/10"
            }`}
          />
          {errors.subject && <p className="text-xs text-rose-500 font-semibold">{errors.subject}</p>}
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
            Detailed Message <span className="text-rose-500">*</span>
          </label>
          <textarea
            name="message"
            rows={5}
            value={formData.message}
            onChange={handleChange}
            placeholder="Please describe your question or issue in detail..."
            className={`w-full p-4 rounded-2xl border bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-white text-sm sm:text-base font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none ${
              errors.message ? "border-rose-500" : "border-gray-200 dark:border-white/10"
            }`}
          />
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Minimum 10 characters</span>
            <span>{formData.message.length} chars</span>
          </div>
          {errors.message && <p className="text-xs text-rose-500 font-semibold">{errors.message}</p>}
        </div>

        {/* Submit CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={status.loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {status.loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending Message...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export function ContactInfoSidebar() {
  const contactDetails = [
    {
      title: "Support Email",
      value: "contact@smartnshine.in",
      href: "mailto:contact@smartnshine.in",
      icon: Mail,
      desc: "Direct ticket inbox with rapid responses",
    },
    {
      title: "Help Desk",
      value: "+91 98765 43210",
      href: "tel:+919876543210",
      icon: Phone,
      desc: "Mon - Sat (9:00 AM to 7:00 PM IST)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Contact Channels Card */}
      <div className="bg-white dark:bg-zinc-900/90 rounded-3xl p-6 sm:p-7 border border-gray-200/90 dark:border-white/[0.08] shadow-sm space-y-5">
        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
          Support Channels
        </h3>

        <div className="space-y-4">
          {contactDetails.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-gray-50/70 dark:bg-zinc-950/60 border border-gray-200/70 dark:border-white/5"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    {item.title}
                  </p>
                  <a
                    href={item.href}
                    className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate mt-0.5"
                  >
                    {item.value}
                  </a>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enterprise & Custom Inquiries */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-cyan-500/10 border border-blue-500/20 space-y-2">
        <h4 className="text-sm font-black text-gray-900 dark:text-white">
          Enterprise & University Inquiries
        </h4>
        <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
          Looking for bulk student licenses, campus career portals, or custom ATS testing integrations? Write to us directly at{" "}
          <a href="mailto:contact@smartnshine.in" className="font-bold text-blue-600 dark:text-blue-400 underline">
            contact@smartnshine.in
          </a>
        </p>
      </div>
    </div>
  );
}
