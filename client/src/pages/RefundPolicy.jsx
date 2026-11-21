import {Link} from "react-router-dom";
import {
  RotateCcw,
  Calendar,
  Mail,
  CheckCircle,
  XCircle,
  TriangleAlert,
  ClipboardList,
  Lightbulb,
} from "lucide-react";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto pt-14">
        {/* Header */}
        <div className="bg-white dark:bg-black rounded-3xl shadow-sm dark:shadow-none p-8 mb-8 border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gray-100 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-white/10">
              <RotateCcw className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                Refund & Cancellation Policy
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                <Calendar className="w-4 h-4" />
                <span>Last Updated: December 1, 2025</span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Please read our refund and cancellation policy carefully before
            making a purchase.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-black rounded-3xl shadow-sm dark:shadow-none p-8 space-y-8 border border-gray-200 dark:border-white/10">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              1. Refund Policy Overview
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl p-5 mb-4 border border-yellow-200 dark:border-yellow-900/40">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-semibold flex items-start gap-2">
                <TriangleAlert className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    Important:
                  </strong>{" "}
                  We operate a strict 24-hour refund policy. Once you start
                  using the service and 24 hours have passed, refunds are NOT
                  available except for payment failures or technical issues
                  preventing service delivery.
                </span>
              </p>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              At SmartNShine, we provide instant digital access to our resume
              building platform. Since our service is delivered immediately upon
              payment, we maintain a limited refund window. Please ensure you
              review our features before purchasing.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              2. Eligibility for Refunds
            </h2>

            <div className="space-y-4">
              {/* One-Time Plan */}
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 border border-blue-200 dark:border-blue-900/40">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      One-Time Plan (₹49 for 21 days)
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                      <li>
                        <strong>24-Hour Refund Window:</strong> Full refund
                        available within 24 hours of purchase ONLY
                      </li>
                      <li>
                        Service must NOT have been actively used (no resumes
                        created/downloaded)
                      </li>
                      <li>Valid reason must be provided</li>
                      <li>
                        After 24 hours: NO REFUNDS (service already delivered)
                      </li>
                      <li>
                        Refunds processed within 5-7 business days to original
                        payment method
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Pro Monthly */}
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 border border-blue-200 dark:border-blue-900/40">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Pro Monthly Plan (₹199/month)
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                      <li>
                        <strong>24-Hour Refund Window:</strong> Full refund
                        within 24 hours of first payment ONLY
                      </li>
                      <li>Service must NOT have been actively used</li>
                      <li>Pro-rated refunds are NOT available</li>
                      <li>
                        Can cancel anytime to stop future charges (NO refund for
                        current period)
                      </li>
                      <li>After 24 hours: NO REFUNDS</li>
                      <li>Refunds processed within 5-7 business days</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Free Plan */}
              <div className="bg-white dark:bg-black rounded-xl p-5 border border-gray-200 dark:border-white/10">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Free Plan (₹0)
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      No refunds applicable as this is a free service.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Failures - ALWAYS REFUNDED */}
              <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-5 border border-green-300 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Payment Failures & Technical Issues
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                      <li>
                        <strong>ALWAYS REFUNDED:</strong> Money deducted but
                        service not activated
                      </li>
                      <li>Duplicate charges due to technical errors</li>
                      <li>
                        Service completely inaccessible due to our technical
                        issues
                      </li>
                      <li>Account not upgraded after successful payment</li>
                      <li>
                        Processed within 3-5 business days with proof of payment
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              3. Non-Refundable Situations
            </h2>
            <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-5 border border-red-200 dark:border-red-900/40">
              <p className="text-gray-700 dark:text-gray-300 mb-3 font-semibold">
                <strong className="text-red-600 dark:text-red-400">
                  NO REFUNDS
                </strong>{" "}
                will be provided in the following cases:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>
                  <strong>After 24 hours:</strong> Request made after the
                  24-hour window
                </li>
                <li>
                  <strong>Service Used:</strong> Any resumes created,
                  downloaded, or AI features used
                </li>
                <li>
                  <strong>Change of Mind:</strong> Not liking the templates or
                  features after purchasing
                </li>
                <li>
                  <strong>Terms Violation:</strong> Account suspended due to
                  fraudulent activity
                </li>
                <li>
                  <strong>User Error:</strong> Technical issues on user's device
                  or internet connection
                </li>
                <li>
                  <strong>Auto-Renewal:</strong> Failure to cancel subscription
                  before renewal date
                </li>
                <li>
                  <strong>Partial Usage:</strong> Using service even for 1 day
                  and then requesting refund
                </li>
                <li>
                  <strong>Competition:</strong> Purchasing to copy templates or
                  reverse-engineer features
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              4. Cancellation Policy
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  4.1 How to Cancel
                </h3>
                <p className="mb-2">You can cancel your subscription:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Through your account dashboard settings</li>
                  <li>By contacting customer support</li>
                  <li>Via email to contact@smartnshine.in</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  4.2 When Cancellation Takes Effect
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Immediate Effect:</strong> You can cancel anytime
                  </li>
                  <li>
                    <strong>Access Continues:</strong> You retain access until
                    the end of current billing period
                  </li>
                  <li>
                    <strong>No Future Charges:</strong> Your subscription will
                    not auto-renew
                  </li>
                  <li>
                    <strong>NO REFUND:</strong> Cancellation does NOT provide
                    refund for current period
                  </li>
                  <li>
                    <strong>Data Retention:</strong> Your data remains
                    accessible during the paid period
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  4.3 One-Time Plan Cancellation
                </h3>
                <p>
                  One-time plans (21 days) cannot be cancelled mid-period for a
                  refund after the 24-hour window. The service remains active
                  for the full 21 days. You can request account deletion if
                  desired.
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl p-5 mt-4 border border-yellow-200 dark:border-yellow-900/40">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong className="text-yellow-800 dark:text-yellow-400 inline-flex items-center gap-1.5">
                    <TriangleAlert className="w-4 h-4" /> Important:
                  </strong>
                  Cancelling your subscription only stops future charges. It
                  does NOT entitle you to a refund for the current billing
                  period unless within the 24-hour refund window.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              5. Refund Process & Timeline
            </h2>

            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 mb-4 border border-blue-200 dark:border-blue-900/40">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 inline-flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Information Needed for Refund Request:
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>
                  <strong>Your registered email address</strong>
                </li>
                <li>
                  <strong>Payment ID</strong> (found in your account dashboard
                  under "Subscription" or in payment confirmation email)
                </li>
                <li>
                  <strong>Brief reason for refund</strong> (e.g., payment
                  failure, service not activated, duplicate charge)
                </li>
                <li>
                  <strong>Transaction date</strong> (if you remember)
                </li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 italic inline-flex items-start gap-2">
                <Lightbulb className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>
                  Tip: Check your email for "Payment Successful" notification
                  from Razorpay - it contains your Payment ID
                </span>
              </p>
            </div>

            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Step 1:
                </span>
                <p>
                  Submit refund request via email to{" "}
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    contact@smartnshine.in
                  </span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Step 2:
                </span>
                <p>
                  Include your registered email, Payment ID (from account
                  dashboard or confirmation email), and refund reason
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Step 3:
                </span>
                <p>Our team reviews your request within 2-3 business days</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Step 4:
                </span>
                <p>
                  If approved, refund is processed to original payment method
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Step 5:
                </span>
                <p>
                  Refund reflects in your account within 5-7 business days
                  (depending on bank)
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              6. Payment Method & Currency
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                <strong className="text-gray-900 dark:text-white">
                  Currency:
                </strong>{" "}
                All prices are in Indian Rupees (INR - ₹)
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">
                  Payment Gateway:
                </strong>{" "}
                Razorpay (Supports UPI, Cards, Net Banking, Wallets)
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">
                  Refund Method:
                </strong>{" "}
                Refunds are issued to the original payment method used
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">
                  Processing Time:
                </strong>{" "}
                5-7 business days after approval
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. Subscription Renewal
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-900/40">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                <strong className="text-gray-900 dark:text-white">
                  Important:
                </strong>{" "}
                Pro Monthly subscriptions auto-renew unless cancelled.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>You will receive an email reminder before renewal</li>
                <li>
                  <strong>
                    Cancel at least 24 hours before renewal to avoid charges
                  </strong>
                </li>
                <li>
                  <strong>
                    If charged after renewal, NO REFUND for that billing cycle
                  </strong>{" "}
                  - the 24-hour refund window does not apply to auto-renewals
                </li>
                <li>You can reactivate cancelled subscriptions anytime</li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. Disputes & Chargebacks
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              Please contact us before initiating a chargeback with your bank.
              Chargebacks may result in:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Immediate account suspension</li>
              <li>Loss of access to all features and data</li>
              <li>Inability to create new accounts</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-3">
              We're committed to resolving issues amicably through our refund
              process.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              9. Service Modifications
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to modify pricing, features, or discontinue
              services with 30 days notice. Active subscribers will be notified
              and given the option to cancel for a pro-rated refund if
              significant features are removed.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              10. Questions & Support
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              If you have questions about refunds or cancellations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Check your subscription status in account settings</li>
              <li>Review our FAQ section</li>
              <li>Contact support before requesting refund</li>
            </ul>
          </section>

          {/* Contact Section */}
          <section className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 border border-blue-200 dark:border-blue-900/40">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Contact Us
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              For refund requests and cancellation support:
            </p>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong>{" "}
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  contact@smartnshine.in
                </span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Response Time:</strong> Within 24-48 hours
              </p>
            </div>
          </section>
        </div>

        {/* Related Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            to="/terms-and-conditions"
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Terms & Conditions
          </Link>
          <Link
            to="/pricing"
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            View Pricing
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
