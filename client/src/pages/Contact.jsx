import { useState, useEffect } from "react";
import SEO from "@/components/common/SEO";
import {
  MessageSquare,
  Building,
  Wrench,
  Lightbulb,
  Bug,
  PartyPopper,
  CircleX,
  TriangleAlert,
  CheckCircle,
} from "lucide-react";
import { contactAPI } from "@/api/api";
import { feedbackAPI } from "@/api/feedback.api";
import {
  parseValidationErrors,
  formatFieldErrors,
  handleApiError,
} from "@/utils/errorHandler";
import {
  contactSchema,
  feedbackSchema,
  validateWithSchema,
} from "@/utils/validation";
import toast from "react-hot-toast";
import { useToggle } from "@/hooks";
import {
  ContactBanner,
  ContactForm,
  ContactInfoSidebar,
  FeedbackTab,
} from "@/components/contact";

export default function Contact() {
  const [activeTab, setActiveTab] = useState("contact"); // 'contact' or 'feedback'

  // Contact form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    category: "general",
    message: "",
  });

  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: null,
  });

  const [errors, setErrors] = useState({});

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    type: "improvement",
    title: "",
    description: "",
    priority: "medium",
    category: "other",
    browserInfo: navigator.userAgent,
    deviceInfo: `${navigator.platform} - ${window.screen.width}x${window.screen.height}`,
    pageUrl: window.location.href,
  });

  const [feedbackLoading, , setFeedbackLoadingTrue, setFeedbackLoadingFalse] =
    useToggle(false);
  const [myFeedback, setMyFeedback] = useState([]);
  const [loadingFeedback, , setLoadingFeedbackTrue, setLoadingFeedbackFalse] =
    useToggle(false);
  const [stats, setStats] = useState(null);

  // Fetch feedback data when switching to feedback tab
  useEffect(() => {
    if (activeTab === "feedback") {
      fetchMyFeedback();
      fetchStats();
    }
  }, [activeTab]);

  const fetchMyFeedback = async () => {
    try {
      setLoadingFeedbackTrue();
      const response = await feedbackAPI.getMyFeedback({ limit: 20 });
      setMyFeedback(response.data.feedbacks || []);
    } catch (error) {
      handleApiError(error, "Failed to load your feedback", toast);
    } finally {
      setLoadingFeedbackFalse();
    }
  };

  const fetchStats = async () => {
    try {
      const response = await feedbackAPI.getFeedbackStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error("Feedback stats error:", error);
    }
  };

  const categories = [
    { value: "general", label: "General Inquiry", icon: MessageSquare },
    { value: "support", label: "Technical Support", icon: Wrench },
    { value: "business", label: "Business & Enterprise Inquiry", icon: Building },
  ];

  const feedbackTypes = [
    {
      id: "improvement",
      label: "Improvement",
      icon: Lightbulb,
      description: "Suggest ways to make our app better",
    },
    {
      id: "feedback",
      label: "General Feedback",
      icon: MessageSquare,
      description: "Share your thoughts and experiences",
    },
    {
      id: "bug",
      label: "Bug Report",
      icon: Bug,
      description: "Report issues or technical problems",
    },
  ];

  const feedbackCategories = [
    { value: "ui-ux", label: "UI / UX Design" },
    { value: "feature-request", label: "Feature Request" },
    { value: "performance", label: "Performance & Speed" },
    { value: "ai-enhancement", label: "AI & Smart Enhancements" },
    { value: "template", label: "ATS Templates" },
    { value: "authentication", label: "Authentication & Profile" },
    { value: "other", label: "Other" },
  ];

  const validateForm = async () => {
    const { isValid, errors: validationErrors } = await validateWithSchema(
      contactSchema,
      formData
    );
    setErrors(validationErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    setStatus({ loading: true, success: false, error: null });

    try {
      await contactAPI.submit(formData);

      setStatus({ loading: false, success: true, error: null });
      toast.success("Message sent successfully! We'll get back to you soon.", {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        duration: 3000,
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        subject: "",
        category: "general",
        message: "",
      });

      setTimeout(() => {
        setStatus({ loading: false, success: false, error: null });
      }, 5000);
    } catch (err) {
      const fieldErrors = formatFieldErrors(err);
      if (fieldErrors) {
        setErrors(fieldErrors);
      }

      setStatus({
        loading: false,
        success: false,
        error: parseValidationErrors(err),
      });
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = await validateWithSchema(
      feedbackSchema,
      feedbackForm
    );

    if (!isValid) {
      toast.error(Object.values(validationErrors)[0], {
        icon: <TriangleAlert className="w-4 h-4 text-amber-600" />,
        duration: 4000,
      });
      return;
    }

    setFeedbackLoadingTrue();

    try {
      await feedbackAPI.submitFeedback(feedbackForm);
      toast.success("Feedback submitted successfully! Thank you!", {
        icon: <PartyPopper className="w-4 h-4 text-indigo-600" />,
        duration: 3000,
      });

      setFeedbackForm({
        type: feedbackForm.type,
        title: "",
        description: "",
        priority: "medium",
        category: "other",
        browserInfo: navigator.userAgent,
        deviceInfo: `${navigator.platform} - ${window.screen.width}x${window.screen.height}`,
        pageUrl: window.location.href,
      });

      fetchMyFeedback();
      fetchStats();
    } catch (error) {
      toast.error(parseValidationErrors(error), {
        icon: <CircleX className="w-4 h-4 text-red-600" />,
        duration: 4000,
      });
    } finally {
      setFeedbackLoadingFalse();
    }
  };

  const handleUpvote = async (id) => {
    try {
      await feedbackAPI.upvoteFeedback(id);
      fetchMyFeedback();
      toast.success("Vote updated!");
    } catch (error) {
      console.error("Error upvoting:", error);
    }
  };

  const handleDeleteFeedback = async (id) => {
    if (window.confirm("Are you sure you want to delete this feedback ticket?")) {
      try {
        await feedbackAPI.deleteFeedback(id);
        fetchMyFeedback();
        fetchStats();
        toast.success("Feedback ticket removed.");
      } catch (error) {
        toast.error("Failed to delete feedback");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] text-gray-900 dark:text-zinc-100 transition-colors duration-200">
      <SEO
        title="Contact Us & Feedback - Help Desk | SmartNShine"
        description="Get in touch with the SmartNShine support team. Submit technical inquiries, bug reports, and product feedback directly to our developers."
        keywords="contact support, customer service, feedback, help center, resume builder support"
        url="https://www.smartnshine.app/contact"
      />

      <div className="workspace-container py-6 sm:py-8 space-y-8">
        {/* Top Hero Banner */}
        <ContactBanner activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab 1: Direct Contact Form & Sidebar */}
        {activeTab === "contact" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <ContactForm
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                status={status}
                errors={errors}
                categories={categories}
              />
            </div>
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <ContactInfoSidebar />
            </div>
          </div>
        )}

        {/* Tab 2: Feedback & Bug Submissions */}
        {activeTab === "feedback" && (
          <FeedbackTab
            feedbackForm={feedbackForm}
            setFeedbackForm={setFeedbackForm}
            feedbackTypes={feedbackTypes}
            feedbackCategories={feedbackCategories}
            feedbackLoading={feedbackLoading}
            handleFeedbackSubmit={handleFeedbackSubmit}
            myFeedback={myFeedback}
            loadingFeedback={loadingFeedback}
            handleUpvote={handleUpvote}
            handleDeleteFeedback={handleDeleteFeedback}
          />
        )}
      </div>
    </div>
  );
}
