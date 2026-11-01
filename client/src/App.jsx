import {Routes, Route, Navigate} from "react-router-dom";
import {Toaster} from "react-hot-toast";
import {lazy, Suspense} from "react";
import {Layout, AdminLayout} from "./components/layout";
import {ScrollToTop} from "./components/common";
import {ProtectedRoute, AdminProtectedRoute, SuperAdminProtectedRoute} from "./components/auth";

// Critical entry page - loaded immediately
import LandingPage from "./pages/LandingPage";

// Lazy load route components for code splitting
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardOverview = lazy(() => import("./pages/DashboardOverview"));

// Lazy load non-critical pages for better performance
const Upload = lazy(() => import("./pages/Upload"));
const Editor = lazy(() => import("./pages/Editor"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const RateLimitExceeded = lazy(() => import("./pages/RateLimitExceeded"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Templates = lazy(() => import("./pages/Templates"));
const GitHubImport = lazy(() => import("./pages/GitHubImport"));
const ATSAnalyzer = lazy(() => import("./pages/ATSAnalyzer"));
const JobSearch = lazy(() => import("./pages/JobSearch"));
const SmartJobMatchPage = lazy(() => import("./pages/SmartJobMatchPage"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Careers = lazy(() => import("./pages/Careers"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const PaymentModal = lazy(() => import("./components/common/PaymentModal"));
const SubscriptionDashboard = lazy(
  () => import("./pages/SubscriptionDashboard")
);
const Profile = lazy(() => import("./pages/Profile"));
const CareerProfile = lazy(() => import("./pages/CareerProfile"));
const CareerApplyPage = lazy(() => import("./pages/CareerApplyPage"));
const CareerQA = lazy(() => import("./pages/CareerQA"));
const PortfolioDashboard = lazy(() => import("./pages/PortfolioDashboard"));
const PortfolioCreate = lazy(() => import("./pages/PortfolioCreate"));
const PortfolioEditor = lazy(() => import("./pages/PortfolioEditor"));
const PortfolioPreview = lazy(() => import("./pages/PortfolioPreview"));
const PublicPortfolio = lazy(() => import("./pages/PublicPortfolio"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const UserDetails = lazy(() => import("./pages/admin/UserDetails"));
const AIAnalytics = lazy(() => import("./pages/admin/AIAnalytics"));
const AIQuotaManagement = lazy(() => import("./pages/admin/AIQuotaManagement"));
const AIExtractionManagement = lazy(
  () => import("./pages/admin/AIExtractionManagement")
);
const ContactMessages = lazy(() => import("./pages/admin/ContactMessages"));
const CareerApplications = lazy(() => import("./pages/admin/CareerApplications"));
const AdminFeedback = lazy(() => import("./pages/admin/AdminFeedback"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminNotifications = lazy(
  () => import("./pages/admin/AdminNotifications")
);
const TemplateManagement = lazy(
  () => import("./pages/admin/TemplateManagement")
);
const PortfolioManagement = lazy(
  () => import("./pages/admin/PortfolioManagement")
);
const AdminPortfolioPreview = lazy(
  () => import("./pages/admin/PortfolioPreview")
);
const AdminQuestionManagement = lazy(
  () => import("./pages/admin/AdminQuestionManagement")
);
const AIInterviewManagement = lazy(
  () => import("./pages/admin/AIInterviewManagement")
);
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const Earnings = lazy(() => import("./pages/admin/Earnings"));
const AIInterview = lazy(() => import("./pages/AIInterview"));
const InterviewHistory = lazy(() => import("./pages/InterviewHistory"));
const InterviewResult = lazy(() => import("./pages/InterviewResult"));
const InterviewPreviewPage = lazy(() => import("./pages/InterviewPreviewPage"));
const PdfRender = lazy(() => import("./pages/PdfRender"));
const SuperAdminLogin = lazy(() => import("./pages/superAdmin/SuperAdminLogin"));
const SuperAdminEnvPanel = lazy(
  () => import("./pages/superAdmin/SuperAdminEnvPanel")
);
const TechPortfolioTemplate = lazy(() => import("./pages/TechPortfolioTemplate"));
const SmartNShinePortfolioTemplate = lazy(() => import("./pages/SmartNShinePortfolioTemplate"));
const MagazinePortfolioTemplate = lazy(() => import("./pages/MagazinePortfolioTemplate"));

import {DarkModeProvider} from "./context/DarkModeContext";
import {NavigationBlockerProvider} from "./context/NavigationBlockerContext";

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <DarkModeProvider>
      <NavigationBlockerProvider>
        <ScrollToTop />
        {/* Global Premium Theme-Aware Toast Notifications */}
        <Toaster
          position="top-right"
          gutter={10}
          containerStyle={{
            top: 24,
            right: 24,
          }}
          toastOptions={{
            duration: 3200,
            className: "custom-theme-toast",
            success: {
              className: "custom-theme-toast custom-theme-toast-success",
              iconTheme: {
                primary: "#10b981",
                secondary: "#ffffff",
              },
            },
            error: {
              className: "custom-theme-toast custom-theme-toast-error",
              iconTheme: {
                primary: "#f43f5e",
                secondary: "#ffffff",
              },
            },
            loading: {
              className: "custom-theme-toast",
              iconTheme: {
                primary: "#6366f1",
                secondary: "#ffffff",
              },
            },
          }}
        />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing-preview" element={<Navigate to="/" replace />} />
            <Route path="/landing-v2" element={<Navigate to="/" replace />} />
            <Route path="/portfolio-builder" element={<Navigate to="/tech-portfolio" replace />} />
            <Route path="/portfolios" element={<Navigate to="/tech-portfolio" replace />} />
            <Route path="/ats-resume-checker" element={<Navigate to="/ats-analyzer" replace />} />
            <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />
            <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
            <Route path="/portfolio/create" element={<Navigate to="/portfolio/new" replace />} />
            <Route path="/ai-interview" element={<Navigate to="/interview/preview" replace />} />
            <Route path="/interview/prep" element={<Navigate to="/interview/preview" replace />} />
            <Route path="/jobs" element={<Navigate to="/job-search" replace />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/careers/apply" element={<CareerApplyPage />} />
            <Route path="/careers/apply/:jobId" element={<CareerApplyPage />} />
            <Route path="/pdf-render/:token" element={<PdfRender />} />
            <Route path="/tech-portfolio" element={<TechPortfolioTemplate />} />
            <Route path="/smartnshine-portfolio" element={<SmartNShinePortfolioTemplate />} />
            <Route path="/smartnshine" element={<SmartNShinePortfolioTemplate />} />
            <Route path="/magazine-portfolio" element={<MagazinePortfolioTemplate />} />
            <Route path="/magazine" element={<MagazinePortfolioTemplate />} />
            <Route path="/u/:slug" element={<PublicPortfolio />} />
            <Route
              path="/portfolio/:id/edit"
              element={
                <ProtectedRoute>
                  <PortfolioEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portfolio/:id/preview"
              element={
                <ProtectedRoute>
                  <PortfolioPreview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/career-profile"
              element={
                <ProtectedRoute>
                  <CareerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/career-qa"
              element={
                <ProtectedRoute>
                  <CareerQA />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor"
              element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              }
            />
            <Route element={<Layout />}>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardOverview />
                  </ProtectedRoute>
                }
              />
              {/* Public High-SEO Routes */}
              <Route path="/templates" element={<Templates />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/job-search" element={<JobSearch />} />
              <Route
                path="/smart-job-match"
                element={
                  <ProtectedRoute>
                    <SmartJobMatchPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Require Authentication */}
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <Upload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/github-import"
                element={
                  <ProtectedRoute>
                    <GitHubImport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ats-analyzer"
                element={
                  <ProtectedRoute>
                    <ATSAnalyzer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-resumes"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portfolio"
                element={
                  <ProtectedRoute>
                    <PortfolioDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portfolio/new"
                element={
                  <ProtectedRoute>
                    <PortfolioCreate />
                  </ProtectedRoute>
                }
              />
              {/* Subscription Routes */}
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route
                path="/terms-and-conditions"
                element={<TermsAndConditions />}
              />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/shipping-policy" element={<ShippingPolicy />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route
                path="/rate-limit-exceeded"
                element={<RateLimitExceeded />}
              />
              <Route path="/auth/callback" element={<AuthCallback />} />

              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <PaymentModal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscription"
                element={
                  <ProtectedRoute>
                    <SubscriptionDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* AI Interview Routes */}
              <Route
                path="/interview"
                element={
                  <ProtectedRoute>
                    <AIInterview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/preview"
                element={<InterviewPreviewPage />}
              />
              <Route
                path="/interview/history"
                element={
                  <ProtectedRoute>
                    <InterviewHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/result/:sessionId"
                element={
                  <ProtectedRoute>
                    <InterviewResult />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Admin Routes - Separate Layout */}
            <Route
              path="/admin/portfolio-preview"
              element={
                <AdminProtectedRoute>
                  <AdminPortfolioPreview />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="earnings" element={<Earnings />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/:userId" element={<UserDetails />} />
              <Route path="careers" element={<CareerApplications />} />
              <Route path="templates" element={<TemplateManagement />} />
              <Route path="portfolios" element={<PortfolioManagement />} />
              <Route path="questions" element={<AdminQuestionManagement />} />
              <Route path="interviews" element={<AIInterviewManagement />} />
              <Route path="ai-analytics" element={<AIAnalytics />} />
              <Route path="ai-quota" element={<AIQuotaManagement />} />
              <Route
                path="ai-extraction"
                element={<AIExtractionManagement />}
              />
              <Route path="contacts" element={<ContactMessages />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Super Admin Control Panel Routes */}
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route
              path="/super-admin"
              element={
                <SuperAdminProtectedRoute>
                  <SuperAdminEnvPanel />
                </SuperAdminProtectedRoute>
              }
            />
            <Route
              path="/super-admin/env"
              element={
                <SuperAdminProtectedRoute>
                  <SuperAdminEnvPanel />
                </SuperAdminProtectedRoute>
              }
            />

            {/* 404 Catch-All Route at top level */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </NavigationBlockerProvider>
    </DarkModeProvider>
  );
}

export default App;
