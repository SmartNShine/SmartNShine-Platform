import {Shield, Lock, Eye, UserCheck, FileText, Mail} from "lucide-react";
import {Link} from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto pt-14">
        {/* Header */}
        <div className="bg-white dark:bg-black rounded-3xl shadow-sm dark:shadow-none p-8 mb-8 border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gray-100 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-white/10">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                Privacy Policy
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Last Updated:{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Your privacy is important to us. Learn how we collect, use, and
            protect your data.
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white dark:bg-black rounded-3xl shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 p-8 md:p-12 space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Welcome to SmartNShine. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you
              use our AI-powered resume builder service. Please read this
              privacy policy carefully. If you do not agree with the terms of
              this privacy policy, please do not access the site.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                1. Information We Collect
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  1.1 Personal Information
                </h3>
                <p className="leading-relaxed">
                  We collect information that you provide directly to us,
                  including:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Name, email address, and phone number</li>
                  <li>
                    Resume content including work experience, education, and
                    skills
                  </li>
                  <li>Profile photo (optional)</li>
                  <li>Payment information (processed securely via Razorpay)</li>
                  <li>OAuth credentials (Google, GitHub) for authentication</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  1.2 Automatically Collected Information
                </h3>
                <p className="leading-relaxed">
                  When you access our service, we automatically collect:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Device information (browser type, operating system)</li>
                  <li>IP address and location data</li>
                  <li>Usage data (pages visited, features used, time spent)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  1.3 AI-Generated Content
                </h3>
                <p className="leading-relaxed">
                  We process your resume content through AI services (OpenAI
                  GPT-4o) to provide resume enhancement, parsing, and ATS
                  analysis features. This data is processed securely and not
                  stored by the AI providers beyond the processing time.
                </p>
              </div>
            </div>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                2. How We Use Your Information
              </h2>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Create and manage your account</li>
                <li>Process your resume and provide AI-powered enhancements</li>
                <li>
                  Analyze your resume against job descriptions (ATS scoring)
                </li>
                <li>Process subscription payments and manage billing</li>
                <li>
                  Send important notifications about your account and services
                </li>
                <li>Improve our services and develop new features</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Prevent fraud and ensure platform security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          {/* 3. Data Storage and Security */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                3. Data Storage and Security
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  3.1 Data Storage
                </h3>
                <p className="leading-relaxed">
                  Your data is stored securely on MongoDB Atlas cloud servers
                  with encryption at rest and in transit. Resume files are
                  stored on our secure servers and automatically deleted after
                  processing unless you choose to save them.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  3.2 Security Measures
                </h3>
                <p className="leading-relaxed">
                  We implement industry-standard security measures:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>HTTPS/SSL encryption for all data transmission</li>
                  <li>JWT-based authentication with secure token management</li>
                  <li>Password hashing using bcrypt</li>
                  <li>Rate limiting to prevent abuse</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and user permission systems</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  3.3 Data Retention
                </h3>
                <p className="leading-relaxed">
                  We retain your data as long as your account is active or as
                  needed to provide services. You can request data deletion at
                  any time by contacting us.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Third-Party Services */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <UserCheck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                4. Third-Party Services
              </h2>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed mb-3">
                We use the following third-party services:
              </p>
              <div className="space-y-3">
                <div className="bg-white dark:bg-black p-5 rounded-xl border border-gray-200 dark:border-white/10">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    OpenAI GPT-4o
                  </h4>
                  <p className="text-sm">
                    Used for AI resume parsing, STAR bullet enhancement, and ATS
                    diagnostic features. Subject to{" "}
                    <a
                      href="https://openai.com/policies/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      OpenAI's Privacy Policy
                    </a>
                    .
                  </p>
                </div>
                <div className="bg-white dark:bg-black p-5 rounded-xl border border-gray-200 dark:border-white/10">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Razorpay
                  </h4>
                  <p className="text-sm">
                    Payment processing service. Subject to{" "}
                    <a
                      href="https://razorpay.com/privacy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Razorpay's Privacy Policy
                    </a>
                    .
                  </p>
                </div>
                <div className="bg-white dark:bg-black p-5 rounded-xl border border-gray-200 dark:border-white/10">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Google OAuth & GitHub OAuth
                  </h4>
                  <p className="text-sm">
                    Authentication services for easy sign-in. Subject to their
                    respective privacy policies.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Your Rights */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-lg">
                <Shield className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                5. Your Privacy Rights
              </h2>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>
                  <strong>Access:</strong> Request a copy of your personal data
                </li>
                <li>
                  <strong>Rectification:</strong> Update or correct inaccurate
                  information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your account
                  and data
                </li>
                <li>
                  <strong>Data Portability:</strong> Export your resume data
                </li>
                <li>
                  <strong>Opt-Out:</strong> Unsubscribe from marketing emails
                </li>
                <li>
                  <strong>Object:</strong> Object to processing of your data
                </li>
                <li>
                  <strong>Withdraw Consent:</strong> Withdraw consent for data
                  processing
                </li>
              </ul>
              <p className="mt-4 leading-relaxed">
                To exercise these rights, please contact us at{" "}
                <a
                  href="mailto:contact@smartnshine.in"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  contact@smartnshine.in
                </a>
                .
              </p>
            </div>
          </section>

          {/* 6. Cookies */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Eye className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                6. Cookies and Tracking
              </h2>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed mb-3">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Keep you logged in securely</li>
                <li>Remember your preferences (theme, language)</li>
                <li>Analyze site usage and performance</li>
                <li>Provide personalized features</li>
              </ul>
              <p className="mt-4 leading-relaxed">
                You can control cookies through your browser settings. Note that
                disabling cookies may affect site functionality.
              </p>
            </div>
          </section>

          {/* 7. Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. Children's Privacy
            </h2>
            <div className="text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">
                Our service is not intended for individuals under 16 years of
                age. We do not knowingly collect personal information from
                children. If you are a parent or guardian and believe your child
                has provided us with personal information, please contact us to
                have it removed.
              </p>
            </div>
          </section>

          {/* 8. Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. Changes to This Privacy Policy
            </h2>
            <div className="text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last Updated" date. You are advised
                to review this Privacy Policy periodically for any changes.
              </p>
            </div>
          </section>

          {/* 9. Contact Us */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                9. Contact Us
              </h2>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed mb-4">
                If you have questions or concerns about this Privacy Policy or
                our data practices, please contact us:
              </p>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-5 rounded-xl border border-blue-200 dark:border-blue-900/40 space-y-2">
                <p className="font-semibold text-gray-900 dark:text-white">
                  SmartNShine Privacy Team
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:contact@smartnshine.in"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    contact@smartnshine.in
                  </a>
                </p>
                <p>
                  <strong>Support:</strong>{" "}
                  <Link
                    to="/contact"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Contact Form
                  </Link>
                </p>
              </div>
            </div>
          </section>

          {/* Back to Home */}
          <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <Shield className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
