import {Link} from "react-router-dom";
import {FileText, Calendar, Mail} from "lucide-react";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto pt-14">
        {/* Header */}
        <div className="bg-white dark:bg-black rounded-3xl shadow-sm dark:shadow-none p-8 mb-8 border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gray-100 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-white/10">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                Terms & Conditions
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                <Calendar className="w-4 h-4" />
                <span>Last Updated: December 1, 2025</span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Please read these terms and conditions carefully before using
            SmartNShine Resume Generator service.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-black rounded-3xl shadow-sm dark:shadow-none p-8 space-y-8 border border-gray-200 dark:border-white/10">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              By accessing and using SmartNShine Resume Generator ("the
              Service"), you accept and agree to be bound by these Terms and
              Conditions. If you do not agree to these terms, please do not use
              our Service.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              2. Service Description
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              SmartNShine provides an online resume building platform that
              includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Professional resume templates</li>
              <li>AI-powered content enhancement</li>
              <li>ATS optimization tools</li>
              {/* TEMPORARILY HIDDEN FOR RAZORPAY COMPLIANCE */}
              {/* <li>Job matching features</li> */}
              <li>Cover letter generation</li>
              <li>Portfolio building tools</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              3. User Accounts
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                <strong className="text-gray-900 dark:text-white">
                  3.1 Registration:
                </strong>{" "}
                You must create an account to access certain features. You agree
                to provide accurate and complete information.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">
                  3.2 Account Security:
                </strong>{" "}
                You are responsible for maintaining the confidentiality of your
                account credentials.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">
                  3.3 Age Requirement:
                </strong>{" "}
                You must be at least 18 years old to use this Service.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              4. Subscription Plans & Payments
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                <strong className="text-gray-900 dark:text-white">
                  4.1 Pricing:
                </strong>{" "}
                We offer multiple subscription tiers (Free, One-Time, Pro) with
                different features and pricing in Indian Rupees (INR).
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">
                  4.2 Payment Processing:
                </strong>{" "}
                Payments are processed securely through Razorpay. All prices are
                in INR and inclusive of applicable taxes.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">
                  4.3 Auto-Renewal:
                </strong>{" "}
                Monthly subscriptions automatically renew unless cancelled
                before the renewal date.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">
                  4.4 One-Time Plans:
                </strong>{" "}
                One-time purchases are valid for 21 days and do not auto-renew.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              5. Refund & Cancellation Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Please refer to our{" "}
              <Link
                to="/refund-policy"
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Refund & Cancellation Policy
              </Link>{" "}
              for detailed information about refunds, cancellations, and
              subscription changes.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              6. Intellectual Property Rights
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                <strong className="text-gray-900 dark:text-white">
                  6.1 Ownership:
                </strong>{" "}
                You retain ownership of the content you create using our
                Service.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">
                  6.2 License:
                </strong>{" "}
                We grant you a limited, non-exclusive, non-transferable license
                to use our templates and tools.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">
                  6.3 Platform Rights:
                </strong>{" "}
                All platform features, templates, and AI tools remain the
                property of SmartNShine.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. User Conduct
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Share your account credentials with others</li>
              <li>Upload malicious code or harmful content</li>
              <li>Scrape or copy our templates without permission</li>
              <li>Resell or redistribute our services</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. Data Privacy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Your privacy is important to us. Please review our{" "}
              <Link
                to="/privacy-policy"
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Privacy Policy
              </Link>{" "}
              to understand how we collect, use, and protect your personal
              information.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              9. Limitation of Liability
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                SmartNShine provides the Service "as is" without warranties of
                any kind. We are not liable for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Job application outcomes or interview results</li>
                <li>Technical errors or service interruptions</li>
                <li>Loss of data due to user error or technical issues</li>
                <li>Third-party services or integrations</li>
              </ul>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              10. Termination
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to suspend or terminate your account if you
              violate these Terms. You may cancel your subscription at any time
              through your account settings.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              11. Changes to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update these Terms from time to time. Continued use of the
              Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              12. Governing Law
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              These Terms are governed by the laws of India. Any disputes will
              be resolved in the courts of [Your City], India.
            </p>
          </section>

          {/* Contact Section */}
          <section className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 border border-blue-200 dark:border-blue-900/40">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Contact Us
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              If you have any questions about these Terms & Conditions, please
              contact us at:
            </p>
            <p className="text-blue-600 dark:text-blue-400 font-semibold mt-2">
              contact@smartnshine.in
            </p>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
