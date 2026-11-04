import {Link} from "react-router-dom";
import {Truck, Calendar, Mail, Zap, Download, Clock} from "lucide-react";

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto pt-14">
        {/* Header */}
        <div className="bg-white dark:bg-black rounded-3xl shadow-sm dark:shadow-none p-8 mb-8 border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gray-100 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-white/10">
              <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                Shipping & Delivery Policy
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                <Calendar className="w-4 h-4" />
                <span>Last Updated: December 1, 2025</span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Learn about our instant digital delivery process for all
            subscription plans.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-black rounded-3xl shadow-sm dark:shadow-none p-8 space-y-8 border border-gray-200 dark:border-white/10">
          {/* Section 1 */}
          <section className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 border border-blue-200 dark:border-blue-900/40">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Instant Digital Delivery
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
              SmartNShine is a 100% digital service. There are{" "}
              <strong>NO physical products</strong> to ship. All features and
              services are delivered electronically and instantly upon
              successful payment.
            </p>

            {/* Delivery Timeline Summary */}
            <div className="bg-white dark:bg-black rounded-xl p-5 mt-4 border border-gray-200 dark:border-white/10 border-l-4 border-l-blue-600">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Delivery Timeline Summary
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                    Minimum Time:
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    0 seconds (Instant)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                    Maximum Time:
                  </p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    5 minutes
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                <strong>Breakdown:</strong> Service activates instantly (0-30
                seconds). Confirmation email arrives within 5 minutes.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              1. What is "Delivered"?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              When you purchase a subscription plan, you receive immediate
              access to:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 border border-blue-200 dark:border-blue-900/40">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Digital Features
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>Professional resume templates</li>
                  <li>AI-powered content tools</li>
                  <li>ATS optimization features</li>
                  {/* TEMPORARILY HIDDEN FOR RAZORPAY COMPLIANCE */}
                  {/* <li>Job matching algorithm</li> */}
                  <li>Cover letter generator</li>
                </ul>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 border border-blue-200 dark:border-blue-900/40">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Instant Access
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>Login credentials activated</li>
                  <li>Subscription tier upgraded</li>
                  <li>Usage limits updated</li>
                  <li>Premium features unlocked</li>
                  <li>Dashboard access granted</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              2. Delivery Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 dark:bg-green-900 rounded-full p-2">
                  <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    Immediate Activation (Within Seconds)
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Upon successful payment verification through Razorpay, your
                    subscription is activated instantly. You can start using all
                    features immediately.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    Confirmation Email (Within 5 Minutes)
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    You'll receive a confirmation email with:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4 mt-2">
                    <li>Payment receipt</li>
                    <li>Subscription details</li>
                    <li>Plan duration and expiry date</li>
                    <li>Invoice (with GST details if applicable)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              3. Delivery Process by Plan
            </h2>
            <div className="space-y-4">
              {/* Free Plan */}
              <div className="border border-gray-200 dark:border-white/10 rounded-xl p-5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Free Plan (₹0)
                </h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>Delivery:</strong> Instant upon registration
                  </p>
                  <p>
                    <strong>Access:</strong> Immediately after email
                    verification
                  </p>
                  <p>
                    <strong>No Payment Required:</strong> Start using right away
                  </p>
                </div>
              </div>

              {/* One-Time Plan */}
              <div className="border border-blue-200 dark:border-blue-900/40 rounded-xl p-5 bg-blue-50 dark:bg-blue-950/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  One-Time Plan (₹49 for 21 days)
                </h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>Payment Processing:</strong> Via Razorpay (UPI,
                    Cards, Net Banking)
                  </p>
                  <p>
                    <strong>Activation Time:</strong> Within 30 seconds of
                    successful payment
                  </p>
                  <p>
                    <strong>Validity:</strong> 21 days from activation
                  </p>
                  <p>
                    <strong>Confirmation:</strong> Email receipt sent
                    immediately
                  </p>
                </div>
              </div>

              {/* Pro Monthly */}
              <div className="border border-blue-200 dark:border-blue-900/40 rounded-xl p-5 bg-blue-50 dark:bg-blue-950/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Pro Monthly Plan (₹199/month)
                </h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>Payment Processing:</strong> Secure Razorpay
                    checkout
                  </p>
                  <p>
                    <strong>First Activation:</strong> Instant upon payment
                  </p>
                  <p>
                    <strong>Auto-Renewal:</strong> Every 30 days (can cancel
                    anytime)
                  </p>
                  <p>
                    <strong>Reminder Email:</strong> 3 days before renewal
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              4. What Happens After Purchase?
            </h2>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
              <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-gray-900 dark:text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    1
                  </span>
                  <div>
                    <strong>Payment Confirmed:</strong> Razorpay processes your
                    payment securely
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-gray-900 dark:text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    2
                  </span>
                  <div>
                    <strong>Account Upgraded:</strong> Your subscription tier is
                    updated automatically
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-green-600 text-gray-900 dark:text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    3
                  </span>
                  <div>
                    <strong>Features Unlocked:</strong> All premium features
                    become accessible
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-orange-600 text-gray-900 dark:text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    4
                  </span>
                  <div>
                    <strong>Email Sent:</strong> Confirmation with receipt and
                    invoice
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-pink-600 text-gray-900 dark:text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    5
                  </span>
                  <div>
                    <strong>Start Creating:</strong> Build your resume
                    immediately!
                  </div>
                </li>
              </ol>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              5. No Physical Shipping
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-900/40">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Since SmartNShine is a digital service:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>
                  <strong>No Tracking Number:</strong> Not applicable for
                  digital services
                </li>
                <li>
                  <strong>No Shipping Address:</strong> No physical address
                  required
                </li>
                <li>
                  <strong>No Courier Service:</strong> Instant online delivery
                  only
                </li>
                <li>
                  <strong>No Customs/Import:</strong> Accessible worldwide
                  instantly
                </li>
                <li>
                  <strong>Zero Carbon Footprint:</strong> Completely
                  eco-friendly delivery
                </li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              6. Delivery Issues & Support
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>If you experience any issues with service activation:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Payment Successful but No Access:</strong> Wait 2-3
                  minutes and refresh your dashboard
                </li>
                <li>
                  <strong>Email Not Received:</strong> Check spam/junk folder
                </li>
                <li>
                  <strong>Features Not Unlocked:</strong> Log out and log back
                  in
                </li>
                <li>
                  <strong>Still Having Issues:</strong> Contact support
                  immediately
                </li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. Geographic Availability
            </h2>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-5 border border-green-200 dark:border-green-900/40">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                <strong className="text-gray-900 dark:text-white">
                  Available Worldwide:
                </strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Accessible from any country with internet</li>
                <li>No geographic restrictions</li>
                <li>Pricing in Indian Rupees (INR - ₹)</li>
                <li>24/7 availability - no downtime for delivery</li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. Data Export & Portability
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              You can "deliver" your resume to yourself anytime:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Download resume as PDF instantly</li>
              <li>Export in multiple formats</li>
              <li>No additional shipping costs</li>
              <li>Unlimited downloads during subscription period</li>
            </ul>
          </section>

          {/* Contact Section */}
          <section className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 border border-blue-200 dark:border-blue-900/40">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Need Help with Activation?
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              If your service isn't activated immediately after payment:
            </p>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong>{" "}
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  contact@smartnshine.in
                </span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Subject:</strong> Service Activation Issue
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Include:</strong> Order ID, Payment Receipt, Registered
                Email
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Response Time:</strong> Within 2 hours during business
                hours
              </p>
            </div>
          </section>
        </div>

        {/* Related Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            to="/refund-policy"
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Refund Policy
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

export default ShippingPolicy;
