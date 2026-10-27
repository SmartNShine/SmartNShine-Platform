import {useCallback, useEffect, useMemo, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Brain,
  Ban,
  Calendar,
  CalendarPlus,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  FileText,
  History,
  Mail,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Shield,
  Sparkles,
  User,
  UserCheck,
  UserX,
  Wallet,
  X,
} from "lucide-react";
import {
  activateUserSubscription,
  cancelUserSubscription,
  downgradeUserSubscription,
  extendUserSubscription,
  getUserDetails,
  resetUserDailyQuota,
  resetUserExtractionCounter,
  updateUserRole,
  updateUserStatus,
} from "@/api/admin.api";
import {ConfirmationModal} from "@/components/common/modals";
import {parseValidationErrors} from "@/utils/errorHandler";
import AdminEmailModal from "./components/AdminEmailModal";

const tabs = [
  {id: "overview", label: "Overview", icon: User},
  {id: "subscription", label: "Subscription", icon: CreditCard},
  {id: "payments", label: "Payments", icon: DollarSign},
  {id: "usage", label: "Usage & Quotas", icon: BarChart3},
  {id: "ai", label: "AI Activity", icon: Brain},
  {id: "resumes", label: "Resumes", icon: FileText},
  {id: "interviews", label: "Interviews", icon: Sparkles},
  {id: "activity", label: "Activity", icon: History},
];

const planOptions = {
  "one-time": [{value: "one-time", label: "One-time"}],
  pro: [
    {value: "monthly", label: "Monthly"},
    {value: "yearly", label: "Yearly"},
  ],
};

const planDefaults = {
  "one-time": {durationDays: 21, amount: 49},
  monthly: {durationDays: 30, amount: 199},
  yearly: {durationDays: 365, amount: 1990},
};

const formatDate = (value) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
};

const formatShortDate = (value) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString();
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

const formatCost = (value) => `$${Number(value || 0).toFixed(4)}`;

const formatMoney = (amount, currency = "INR") => {
  const numericAmount = Number(amount || 0);

  if (currency === "USD") {
    return `$${numericAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `₹${numericAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDuration = (seconds) => {
  const total = Number(seconds || 0);
  if (total <= 0) return "0m";
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

const titleCase = (value) =>
  String(value || "unknown")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const statusVariant = (status) => {
  if (["active", "success", "completed"].includes(status)) return "success";
  if (["disabled", "error", "failed", "abandoned"].includes(status)) {
    return "danger";
  }
  if (["pending", "trial", "in-progress", "paused", "timeout"].includes(status)) {
    return "warning";
  }
  return "default";
};

const Badge = ({children, variant = "default"}) => {
  const variants = {
    default:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10",
    success:
      "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
    warning:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    danger: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
    primary:
      "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
};

const InfoCard = ({label, value, icon: Icon, helper, tone = "cyan"}) => {
  const tones = {
    cyan: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    violet: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {value}
          </p>
          {helper && (
            <p className="mt-1 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
              {helper}
            </p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.cyan}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const Section = ({title, children, action}) => (
  <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-black">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

const EmptyState = ({icon: Icon = Activity, message}) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-center dark:border-white/10">
    <Icon className="h-8 w-8 text-gray-400" />
    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{message}</p>
  </div>
);

const QuotaBar = ({label, value}) => {
  const used = Number(value?.used || 0);
  const unlimited = value?.unlimited;
  const limit = Number(value?.limit || 0);
  const percentage = unlimited || !limit ? 0 : Math.min(100, (used / limit) * 100);

  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formatNumber(used)} / {unlimited ? "Unlimited" : formatNumber(limit)}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-500 transition-all"
          style={{width: `${unlimited ? 100 : percentage}%`}}
        />
      </div>
      {value?.lastReset && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Last reset: {formatDate(value.lastReset)}
        </p>
      )}
    </div>
  );
};

const UserDetails = () => {
  const {userId} = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [pendingAction, setPendingAction] = useState(null);
  const [subscriptionModal, setSubscriptionModal] = useState(null);
  const [subscriptionForm, setSubscriptionForm] = useState({});
  const [subscriptionSubmitting, setSubscriptionSubmitting] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUserDetails(userId);
      setDetails(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching user details:", err);
      setError(err.response?.data?.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const user = details?.user;
  const subscription = details?.subscription?.current || user?.subscription || {};
  const activeSubscriptionRecord = details?.subscription?.activeRecord;
  const paymentSummary = details?.payments?.summary || {};
  const paymentHistory =
    details?.payments?.history || details?.subscription?.history || [];
  const failedPayments = details?.payments?.failed || [];
  const receiptRecords = details?.payments?.receipts || [];
  const aiTotals = details?.aiSummary?.totals || {};
  const usageLimits = details?.usageLimits || {};

  const overviewCounts = useMemo(
    () => ({
      resumes: details?.resumeSummary?.total || details?.resumes?.length || 0,
      aiCalls: aiTotals.calls || details?.aiUsage?.length || 0,
      interviews: details?.interviews?.summary?.total || 0,
      subscriptionTier: subscription?.tier || "free",
    }),
    [details, aiTotals.calls, subscription?.tier]
  );

  const runAction = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === "status") {
        await updateUserStatus(userId, pendingAction.value);
      }
      if (pendingAction.type === "role") {
        await updateUserRole(userId, pendingAction.value);
      }
      if (pendingAction.type === "quota") {
        await resetUserDailyQuota(userId);
      }
      if (pendingAction.type === "extraction") {
        await resetUserExtractionCounter(userId);
      }

      toast.success(pendingAction.successMessage);
      setPendingAction(null);
      await fetchDetails();
    } catch (err) {
      toast.error(parseValidationErrors(err));
      setPendingAction(null);
    }
  };

  const openSubscriptionModal = (action) => {
    const currentTier = ["one-time", "pro"].includes(subscription?.tier)
      ? subscription.tier
      : "pro";
    const currentPlan =
      planOptions[currentTier]?.some((option) => option.value === subscription?.plan)
        ? subscription.plan
        : planOptions[currentTier][0].value;
    const defaults = planDefaults[currentPlan];

    const forms = {
      activate: {
        tier: currentTier,
        plan: currentPlan,
        durationDays: defaults.durationDays,
        amount: defaults.amount,
        currency: "INR",
        autoRenew: currentPlan === "monthly" || currentPlan === "yearly",
        notes: "",
      },
      extend: {
        days: 30,
        reason: "",
      },
      cancel: {
        reason: "Cancelled by admin",
      },
      downgrade: {
        reason: "Downgraded by admin",
      },
    };

    setSubscriptionForm(forms[action] || {});
    setSubscriptionModal(action);
  };

  const updateSubscriptionForm = (field, value) => {
    setSubscriptionForm((current) => ({...current, [field]: value}));
  };

  const handleSubscriptionTierChange = (tier) => {
    const nextPlan = planOptions[tier][0].value;
    const defaults = planDefaults[nextPlan];
    setSubscriptionForm((current) => ({
      ...current,
      tier,
      plan: nextPlan,
      durationDays: defaults.durationDays,
      amount: defaults.amount,
      autoRenew: nextPlan === "monthly" || nextPlan === "yearly",
    }));
  };

  const handleSubscriptionPlanChange = (plan) => {
    const defaults = planDefaults[plan];
    setSubscriptionForm((current) => ({
      ...current,
      plan,
      durationDays: defaults.durationDays,
      amount: defaults.amount,
      autoRenew: plan === "monthly" || plan === "yearly",
    }));
  };

  const submitSubscriptionAction = async () => {
    if (!subscriptionModal) return;

    try {
      setSubscriptionSubmitting(true);

      if (subscriptionModal === "activate") {
        await activateUserSubscription(userId, {
          ...subscriptionForm,
          durationDays: Number(subscriptionForm.durationDays),
          amount: Number(subscriptionForm.amount),
        });
      }

      if (subscriptionModal === "extend") {
        await extendUserSubscription(userId, {
          days: Number(subscriptionForm.days),
          reason: subscriptionForm.reason,
        });
      }

      if (subscriptionModal === "cancel") {
        await cancelUserSubscription(userId, {
          reason: subscriptionForm.reason,
        });
      }

      if (subscriptionModal === "downgrade") {
        await downgradeUserSubscription(userId, {
          reason: subscriptionForm.reason,
        });
      }

      toast.success("Subscription updated");
      setSubscriptionModal(null);
      setSubscriptionForm({});
      await fetchDetails();
    } catch (err) {
      toast.error(parseValidationErrors(err));
    } finally {
      setSubscriptionSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Loading user profile and history...
          </p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/admin/users")}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </button>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-500">
          {error || "User not found"}
        </div>
      </div>
    );
  }

  const initials = user.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate("/admin/users")}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </button>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-black">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-2xl font-bold text-white dark:bg-white dark:text-black">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.name}
                  </h1>
                  <Badge variant={statusVariant(user.status)}>
                    {titleCase(user.status)}
                  </Badge>
                  <Badge variant="primary">{titleCase(user.role)}</Badge>
                  <Badge>{titleCase(subscription?.tier || "free")}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Shield className="h-4 w-4" />
                    {titleCase(user.provider || "local")}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Joined {formatShortDate(user.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Last login {formatShortDate(user.lastLogin)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEmailModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all"
              >
                <Mail className="h-4 w-4" />
                Send Email
              </button>
              <button
                onClick={() =>
                  setPendingAction({
                    type: "status",
                    value: user.status === "active" ? "disabled" : "active",
                    title:
                      user.status === "active" ? "Disable User" : "Enable User",
                    message: `This will ${
                      user.status === "active" ? "disable" : "enable"
                    } ${user.name}.`,
                    confirmText:
                      user.status === "active" ? "Disable User" : "Enable User",
                    successMessage: "User status updated",
                    icon: user.status === "active" ? UserX : UserCheck,
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
              >
                {user.status === "active" ? (
                  <UserX className="h-4 w-4 text-red-500" />
                ) : (
                  <UserCheck className="h-4 w-4 text-green-500" />
                )}
                {user.status === "active" ? "Disable" : "Enable"}
              </button>

              <select
                value={user.role}
                onChange={(event) =>
                  setPendingAction({
                    type: "role",
                    value: event.target.value,
                    title: "Change User Role",
                    message: `Change ${user.name}'s role to ${event.target.value}?`,
                    confirmText: "Change Role",
                    successMessage: "User role updated",
                    icon: Shield,
                  })
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 dark:border-white/10 dark:bg-black dark:text-white"
              >
                <option value="user" className="bg-white dark:bg-[#1a1a1a]">
                  User
                </option>
                <option value="admin" className="bg-white dark:bg-[#1a1a1a]">
                  Admin
                </option>
              </select>

              <button
                onClick={() =>
                  setPendingAction({
                    type: "quota",
                    title: "Reset Usage Quotas",
                    message:
                      "This will reset the user's daily and monthly quota counters. Historical AI usage records are preserved for analytics.",
                    confirmText: "Reset Quotas",
                    successMessage: "Usage quotas reset",
                    icon: RotateCcw,
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyan-700"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Quotas
              </button>

              <button
                onClick={() =>
                  setPendingAction({
                    type: "extraction",
                    title: "Reset AI Extraction Counter",
                    message:
                      "This will reset today's AI resume extraction counter for this user.",
                    confirmText: "Reset Extraction",
                    successMessage: "AI extraction counter reset",
                    icon: RefreshCw,
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-600 transition hover:bg-violet-500/20 dark:text-violet-300"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Extraction
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-black">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-gray-900 text-white dark:bg-white dark:text-black"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Resumes"
              value={formatNumber(overviewCounts.resumes)}
              icon={FileText}
              tone="cyan"
            />
            <InfoCard
              label="AI Calls"
              value={formatNumber(overviewCounts.aiCalls)}
              icon={Brain}
              helper={`${formatNumber(aiTotals.tokens)} tokens`}
              tone="violet"
            />
            <InfoCard
              label="Interviews"
              value={formatNumber(overviewCounts.interviews)}
              icon={Sparkles}
              tone="amber"
            />
            <InfoCard
              label="AI Cost"
              value={formatCost(aiTotals.cost)}
              icon={Wallet}
              tone="green"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Section title="Account Details">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Detail label="Name" value={user.name} />
                <Detail label="Email" value={user.email} />
                <Detail label="Provider" value={titleCase(user.provider)} />
                <Detail label="Status" value={titleCase(user.status)} />
                <Detail label="Role" value={titleCase(user.role)} />
                <Detail label="Currency" value={user.preferences?.currency || "INR"} />
                <Detail label="Created" value={formatDate(user.createdAt)} />
                <Detail label="Updated" value={formatDate(user.updatedAt)} />
              </dl>
            </Section>

            <Section title="Subscription Snapshot">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Detail label="Tier" value={titleCase(subscription?.tier || "free")} />
                <Detail
                  label="Plan"
                  value={subscription?.plan ? titleCase(subscription.plan) : "Not available"}
                />
                <Detail
                  label="Status"
                  value={titleCase(subscription?.status || "active")}
                />
                <Detail
                  label="Auto Renew"
                  value={subscription?.autoRenew ? "Enabled" : "Disabled"}
                />
                <Detail label="Start Date" value={formatDate(subscription?.startDate)} />
                <Detail label="End Date" value={formatDate(subscription?.endDate)} />
                <Detail label="Payment ID" value={subscription?.paymentId || "Not available"} />
                <Detail label="Order ID" value={subscription?.orderId || "Not available"} />
              </dl>
            </Section>
          </div>
        </div>
      )}

      {activeTab === "subscription" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Current Tier"
              value={titleCase(subscription?.tier || "free")}
              icon={CreditCard}
              helper={titleCase(subscription?.plan || "free")}
              tone="cyan"
            />
            <InfoCard
              label="Status"
              value={titleCase(subscription?.status || "active")}
              icon={CheckCircle}
              helper={`Auto renew ${subscription?.autoRenew ? "on" : "off"}`}
              tone={subscription?.status === "active" ? "green" : "amber"}
            />
            <InfoCard
              label="Started"
              value={formatShortDate(subscription?.startDate)}
              icon={Calendar}
              tone="violet"
            />
            <InfoCard
              label="Ends"
              value={formatShortDate(subscription?.endDate)}
              icon={Clock}
              tone="rose"
            />
          </div>

          <Section
            title="Subscription Controls"
            action={
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openSubscriptionModal("activate")}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyan-700"
                >
                  <PlusCircle className="h-4 w-4" />
                  Activate
                </button>
                <button
                  onClick={() => openSubscriptionModal("extend")}
                  disabled={
                    !["one-time", "pro"].includes(subscription?.tier) ||
                    subscription?.status !== "active"
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Extend
                </button>
                <button
                  onClick={() => openSubscriptionModal("cancel")}
                  disabled={!["one-time", "pro"].includes(subscription?.tier)}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-300"
                >
                  <Ban className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={() => openSubscriptionModal("downgrade")}
                  disabled={(subscription?.tier || "free") === "free"}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300"
                >
                  <UserX className="h-4 w-4" />
                  Downgrade
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  User Subscription
                </h3>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Detail label="Tier" value={titleCase(subscription?.tier || "free")} />
                  <Detail
                    label="Plan"
                    value={subscription?.plan ? titleCase(subscription.plan) : "Not available"}
                  />
                  <Detail
                    label="Status"
                    value={titleCase(subscription?.status || "active")}
                  />
                  <Detail
                    label="Auto Renew"
                    value={subscription?.autoRenew ? "Enabled" : "Disabled"}
                  />
                  <Detail label="Start Date" value={formatDate(subscription?.startDate)} />
                  <Detail label="End Date" value={formatDate(subscription?.endDate)} />
                  <Detail label="Payment ID" value={subscription?.paymentId || "Not available"} />
                  <Detail label="Order ID" value={subscription?.orderId || "Not available"} />
                </dl>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Active Record
                </h3>
                {activeSubscriptionRecord ? (
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Detail
                      label="Record Tier"
                      value={titleCase(activeSubscriptionRecord.tier)}
                    />
                    <Detail
                      label="Record Plan"
                      value={titleCase(activeSubscriptionRecord.plan)}
                    />
                    <Detail
                      label="Record Status"
                      value={titleCase(activeSubscriptionRecord.status)}
                    />
                    <Detail
                      label="Amount"
                      value={`${activeSubscriptionRecord.currency || "INR"} ${formatNumber(activeSubscriptionRecord.amount)}`}
                    />
                    <Detail
                      label="Receipt"
                      value={activeSubscriptionRecord.receiptId || "Not available"}
                    />
                    <Detail
                      label="Created"
                      value={formatDate(activeSubscriptionRecord.createdAt)}
                    />
                  </dl>
                ) : (
                  <EmptyState
                    icon={CreditCard}
                    message="No active subscription record is linked to this user."
                  />
                )}
              </div>
            </div>
          </Section>

          <Section title="Subscription History">
            {details.subscription?.history?.length ? (
              <ResponsiveTable
                headers={["Tier", "Plan", "Status", "Amount", "Receipt", "Start", "End"]}
                rows={details.subscription.history.map((subscriptionRecord) => [
                  titleCase(subscriptionRecord.tier),
                  titleCase(subscriptionRecord.plan),
                  <Badge
                    key="status"
                    variant={statusVariant(subscriptionRecord.status)}
                  >
                    {titleCase(subscriptionRecord.status)}
                  </Badge>,
                  `${subscriptionRecord.currency || "INR"} ${formatNumber(subscriptionRecord.amount)}`,
                  subscriptionRecord.receiptId || "Not available",
                  formatDate(subscriptionRecord.startDate),
                  formatDate(subscriptionRecord.endDate),
                ])}
              />
            ) : (
              <EmptyState icon={Wallet} message="No subscription history for this user." />
            )}
          </Section>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Paid Revenue"
              value={formatMoney(paymentSummary?.paidAmountByCurrency?.INR || 0)}
              icon={Wallet}
              helper={
                paymentSummary?.paidAmountByCurrency?.USD
                  ? `${formatMoney(paymentSummary.paidAmountByCurrency.USD, "USD")} USD`
                  : `${formatNumber(paymentSummary.successfulPayments)} successful`
              }
              tone="green"
            />
            <InfoCard
              label="Failed Payments"
              value={formatNumber(paymentSummary.failedPayments)}
              icon={Ban}
              helper={
                paymentSummary?.failedAmountByCurrency?.INR
                  ? `${formatMoney(paymentSummary.failedAmountByCurrency.INR)} failed value`
                  : "No failed value recorded"
              }
              tone="rose"
            />
            <InfoCard
              label="Receipts"
              value={formatNumber(paymentSummary.receipts)}
              icon={FileText}
              helper={`${formatNumber(receiptRecords.length)} available records`}
              tone="cyan"
            />
            <InfoCard
              label="Payment Records"
              value={formatNumber(paymentSummary.totalPayments)}
              icon={CreditCard}
              helper={`${formatNumber(paymentHistory.length)} total rows`}
              tone="violet"
            />
          </div>

          <Section title="Payment History">
            {paymentHistory.length ? (
              <ResponsiveTable
                headers={[
                  "Plan",
                  "Status",
                  "Amount",
                  "Method",
                  "Payment ID",
                  "Receipt",
                  "Created",
                  "Action",
                ]}
                rows={paymentHistory.map((payment) => [
                  `${titleCase(payment.tier)} / ${titleCase(payment.plan)}`,
                  <Badge key="status" variant={statusVariant(payment.status)}>
                    {titleCase(payment.status)}
                  </Badge>,
                  formatMoney(payment.amount, payment.currency || "INR"),
                  titleCase(payment.paymentMethod || "unknown"),
                  payment.paymentId || "Not available",
                  payment.receiptId || payment.invoiceUrl || "Not available",
                  formatDate(payment.createdAt),
                  <button
                    key="receipt"
                    onClick={() => setSelectedReceipt(payment)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Inspect
                  </button>,
                ])}
              />
            ) : (
              <EmptyState icon={CreditCard} message="No payment records for this user." />
            )}
          </Section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Section title="Failed Payments">
              {failedPayments.length ? (
                <div className="space-y-3">
                  {failedPayments.map((payment) => (
                    <PaymentRecordCard
                      key={payment._id}
                      payment={payment}
                      onInspect={() => setSelectedReceipt(payment)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState icon={Ban} message="No failed payments for this user." />
              )}
            </Section>

            <Section title="Receipts">
              {receiptRecords.length ? (
                <div className="space-y-3">
                  {receiptRecords.map((payment) => (
                    <PaymentRecordCard
                      key={payment._id}
                      payment={payment}
                      onInspect={() => setSelectedReceipt(payment)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState icon={FileText} message="No receipts available for this user." />
              )}
            </Section>
          </div>
        </div>
      )}

      {activeTab === "usage" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <QuotaBar label="Resumes Per Month" value={usageLimits.resumesPerMonth} />
            <QuotaBar
              label="Downloads Per Month"
              value={usageLimits.resumeDownloadsPerMonth}
            />
            <QuotaBar label="ATS Scans Per Month" value={usageLimits.atsScansPerMonth} />
            <QuotaBar label="Job Matches Per Day" value={usageLimits.jobMatchesPerDay} />
            <QuotaBar
              label="Cover Letters Per Month"
              value={usageLimits.coverLettersPerMonth}
            />
            <QuotaBar
              label="AI Generations Per Month"
              value={usageLimits.aiGenerationsPerMonth}
            />
            <QuotaBar
              label="AI Resume Extractions Per Day"
              value={usageLimits.aiResumeExtractionsPerDay}
            />
          </div>

          <Section
            title="Stored Counters"
            action={
              <Link
                to="/admin/ai-quota"
                className="text-sm font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
              >
                Open AI quota page
              </Link>
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Object.entries(user.usage || {}).map(([key, value]) => (
                <Detail
                  key={key}
                  label={titleCase(key)}
                  value={key.toLowerCase().includes("date") || key.toLowerCase().includes("reset") ? formatDate(value) : formatNumber(value)}
                />
              ))}
            </div>
          </Section>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="Total Calls" value={formatNumber(aiTotals.calls)} icon={Brain} tone="violet" />
            <InfoCard label="Successful" value={formatNumber(aiTotals.success)} icon={CheckCircle} tone="green" />
            <InfoCard label="Errors" value={formatNumber(aiTotals.errors)} icon={Activity} tone="rose" />
            <InfoCard label="Tokens" value={formatNumber(aiTotals.tokens)} icon={BarChart3} tone="cyan" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SummaryList title="By Feature" rows={details.aiSummary?.byFeature || []} />
            <SummaryList title="By Provider" rows={details.aiSummary?.byProvider || []} />
          </div>

          <Section title="Recent AI Requests">
            {details.aiUsage?.length ? (
              <ResponsiveTable
                headers={["Feature", "Provider", "Status", "Tokens", "Cost", "Created"]}
                rows={details.aiUsage.map((usage) => [
                  titleCase(usage.feature),
                  titleCase(usage.aiProvider),
                  <Badge key="status" variant={statusVariant(usage.status)}>
                    {titleCase(usage.status)}
                  </Badge>,
                  formatNumber(usage.tokensUsed),
                  formatCost(usage.cost),
                  formatDate(usage.createdAt),
                ])}
              />
            ) : (
              <EmptyState icon={Brain} message="No AI usage records for this user." />
            )}
          </Section>
        </div>
      )}

      {activeTab === "resumes" && (
        <Section title="Resume Summaries">
          {details.resumes?.length ? (
            <ResponsiveTable
              headers={["Title", "Resume Name", "Template", "Theme", "Created", "Updated"]}
              rows={details.resumes.map((resume) => [
                resume.resumeTitle || "Untitled Resume",
                resume.name || "Not available",
                titleCase(resume.templateId || "classic"),
                resume.colorTheme || "Default",
                formatDate(resume.createdAt),
                formatDate(resume.updatedAt),
              ])}
            />
          ) : (
            <EmptyState icon={FileText} message="No resumes created by this user." />
          )}
        </Section>
      )}

      {activeTab === "interviews" && (
        <Section title="Interview Sessions">
          {details.interviews?.sessions?.length ? (
            <ResponsiveTable
              headers={["Role", "Type", "Status", "Progress", "Score", "Duration", "Created"]}
              rows={details.interviews.sessions.map((session) => [
                session.role || "Not available",
                titleCase(session.interviewType),
                <Badge key="status" variant={statusVariant(session.status)}>
                  {titleCase(session.status)}
                </Badge>,
                `${session.progress || 0}%`,
                session.averageScore ? `${session.averageScore}%` : "Not scored",
                formatDuration(session.totalDurationSeconds),
                formatDate(session.createdAt),
              ])}
            />
          ) : (
            <EmptyState icon={Sparkles} message="No interview sessions for this user." />
          )}
        </Section>
      )}

      {activeTab === "activity" && (
        <div className="space-y-6">
          <Section title="Admin Activity">
            {details.activity?.length ? (
              <div className="space-y-3">
                {details.activity.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-xl border border-gray-200 p-4 dark:border-white/10"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {titleCase(item.action)} by{" "}
                          {item.adminId?.name || item.adminId?.email || "Unknown admin"}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={History} message="No admin activity for this user yet." />
            )}
          </Section>

          <Section title="Subscription History">
            {details.subscription?.history?.length ? (
              <ResponsiveTable
                headers={["Tier", "Plan", "Status", "Amount", "Start", "End"]}
                rows={details.subscription.history.map((subscriptionRecord) => [
                  titleCase(subscriptionRecord.tier),
                  titleCase(subscriptionRecord.plan),
                  <Badge
                    key="status"
                    variant={statusVariant(subscriptionRecord.status)}
                  >
                    {titleCase(subscriptionRecord.status)}
                  </Badge>,
                  `${subscriptionRecord.currency || "INR"} ${formatNumber(subscriptionRecord.amount)}`,
                  formatDate(subscriptionRecord.startDate),
                  formatDate(subscriptionRecord.endDate),
                ])}
              />
            ) : (
              <EmptyState icon={Wallet} message="No subscription history for this user." />
            )}
          </Section>
        </div>
      )}

      <SubscriptionActionModal
        action={subscriptionModal}
        form={subscriptionForm}
        submitting={subscriptionSubmitting}
        onClose={() => {
          if (!subscriptionSubmitting) {
            setSubscriptionModal(null);
            setSubscriptionForm({});
          }
        }}
        onSubmit={submitSubscriptionAction}
        onChange={updateSubscriptionForm}
        onTierChange={handleSubscriptionTierChange}
        onPlanChange={handleSubscriptionPlanChange}
      />

      <ReceiptDetailsModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      <AdminEmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        initialEmail={user.email}
        initialName={user.name}
      />

      <ConfirmationModal
        isOpen={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={runAction}
        title={pendingAction?.title || "Confirm Action"}
        message={pendingAction?.message || "Are you sure?"}
        confirmText={pendingAction?.confirmText || "Confirm"}
        cancelText="Cancel"
        type={pendingAction?.type === "status" && pendingAction?.value === "disabled" ? "danger" : "warning"}
        icon={pendingAction?.icon || Shield}
      />
    </div>
  );
};

const SubscriptionActionModal = ({
  action,
  form,
  submitting,
  onClose,
  onSubmit,
  onChange,
  onTierChange,
  onPlanChange,
}) => {
  if (!action) return null;

  const config = {
    activate: {
      title: "Activate Subscription",
      description: "Create a manual paid subscription and reset period counters.",
      confirmText: "Activate",
      icon: PlusCircle,
      tone: "cyan",
    },
    extend: {
      title: "Extend Subscription",
      description: "Add access time to the current paid subscription.",
      confirmText: "Extend",
      icon: CalendarPlus,
      tone: "green",
    },
    cancel: {
      title: "Cancel Subscription",
      description: "Stop renewal and mark the paid subscription as cancelled.",
      confirmText: "Cancel Subscription",
      icon: Ban,
      tone: "amber",
    },
    downgrade: {
      title: "Downgrade To Free",
      description: "Cancel active paid access and move the user to the free plan.",
      confirmText: "Downgrade",
      icon: UserX,
      tone: "red",
    },
  }[action];

  const Icon = config.icon;
  const toneClasses = {
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
    green: "bg-green-500/10 text-green-600 dark:text-green-300",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    red: "bg-red-500/10 text-red-600 dark:text-red-300",
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${toneClasses[config.tone]}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {config.title}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {config.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {action === "activate" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tier
              <select
                value={form.tier || "pro"}
                onChange={(event) => onTierChange(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-black dark:text-white"
              >
                <option value="pro">Pro</option>
                <option value="one-time">One-time</option>
              </select>
            </label>

            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Plan
              <select
                value={form.plan || "monthly"}
                onChange={(event) => onPlanChange(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-black dark:text-white"
              >
                {(planOptions[form.tier || "pro"] || []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Duration Days
              <input
                type="number"
                min="1"
                value={form.durationDays || ""}
                onChange={(event) => onChange("durationDays", event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-black dark:text-white"
                required
              />
            </label>

            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount ?? ""}
                onChange={(event) => onChange("amount", event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-black dark:text-white"
                required
              />
            </label>

            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Currency
              <select
                value={form.currency || "INR"}
                onChange={(event) => onChange("currency", event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-black dark:text-white"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 dark:border-white/10 dark:text-gray-300">
              <input
                type="checkbox"
                checked={Boolean(form.autoRenew)}
                onChange={(event) => onChange("autoRenew", event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-cyan-600"
              />
              Auto renew
            </label>

            <label className="sm:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes
              <textarea
                value={form.notes || ""}
                onChange={(event) => onChange("notes", event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-black dark:text-white"
                placeholder="Internal support note"
              />
            </label>
          </div>
        )}

        {action === "extend" && (
          <div className="grid grid-cols-1 gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Days To Add
              <input
                type="number"
                min="1"
                value={form.days || ""}
                onChange={(event) => onChange("days", event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-black dark:text-white"
                required
              />
            </label>
            <ReasonField value={form.reason} onChange={onChange} />
          </div>
        )}

        {(action === "cancel" || action === "downgrade") && (
          <ReasonField value={form.reason} onChange={onChange} />
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-black dark:border-t-transparent" />
            )}
            {submitting ? "Saving..." : config.confirmText}
          </button>
        </div>
      </form>
    </div>
  );
};

const ReasonField = ({value, onChange}) => (
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
    Reason
    <textarea
      value={value || ""}
      onChange={(event) => onChange("reason", event.target.value)}
      rows={3}
      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-black dark:text-white"
      placeholder="Internal reason for this subscription change"
    />
  </label>
);

const PaymentRecordCard = ({payment, onInspect}) => (
  <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-gray-900 dark:text-white">
            {titleCase(payment.tier)} / {titleCase(payment.plan)}
          </p>
          <Badge variant={statusVariant(payment.status)}>
            {titleCase(payment.status)}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {formatMoney(payment.amount, payment.currency || "INR")} via{" "}
          {titleCase(payment.paymentMethod || "unknown")}
        </p>
        <p className="mt-1 break-all text-xs text-gray-500 dark:text-gray-500">
          {payment.receiptId || payment.paymentId || payment.orderId || "No payment reference"}
        </p>
      </div>
      <button
        onClick={onInspect}
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
      >
        <FileText className="h-3.5 w-3.5" />
        Inspect
      </button>
    </div>
  </div>
);

const ReceiptDetailsModal = ({receipt, onClose}) => {
  if (!receipt) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Payment Receipt
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {receipt.receiptId || receipt.paymentId || "Unreferenced payment"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Tier" value={titleCase(receipt.tier)} />
          <Detail label="Plan" value={titleCase(receipt.plan)} />
          <Detail
            label="Status"
            value={
              <Badge variant={statusVariant(receipt.status)}>
                {titleCase(receipt.status)}
              </Badge>
            }
          />
          <Detail
            label="Amount"
            value={formatMoney(receipt.amount, receipt.currency || "INR")}
          />
          <Detail label="Payment Method" value={titleCase(receipt.paymentMethod)} />
          <Detail label="Receipt ID" value={receipt.receiptId || "Not available"} />
          <Detail label="Payment ID" value={receipt.paymentId || "Not available"} />
          <Detail label="Order ID" value={receipt.orderId || "Not available"} />
          <Detail label="Start Date" value={formatDate(receipt.startDate)} />
          <Detail label="End Date" value={formatDate(receipt.endDate)} />
          <Detail label="Created" value={formatDate(receipt.createdAt)} />
          <Detail label="Updated" value={formatDate(receipt.updatedAt)} />
          <Detail label="Cancelled At" value={formatDate(receipt.cancelledAt)} />
          <Detail label="Cancelled By" value={titleCase(receipt.cancelledBy)} />
          <Detail
            label="Cancel Reason"
            value={receipt.cancelReason || "Not available"}
          />
          <Detail label="Notes" value={receipt.notes || "Not available"} />
        </div>

        {receipt.invoiceUrl && (
          <a
            href={receipt.invoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <ExternalLink className="h-4 w-4" />
            Open Invoice
          </a>
        )}
      </div>
    </div>
  );
};

const Detail = ({label, value}) => (
  <div className="min-w-0 rounded-lg bg-gray-50 p-3 dark:bg-white/5">
    <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
      {label}
    </dt>
    <dd className="mt-1 break-words text-sm font-medium text-gray-900 dark:text-white">
      {value ?? "Not available"}
    </dd>
  </div>
);

const SummaryList = ({title, rows}) => (
  <Section title={title}>
    {rows.length ? (
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row._id || "unknown"}
            className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 dark:border-white/10"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900 dark:text-white">
                {titleCase(row._id)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatNumber(row.totalTokens)} tokens
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatNumber(row.count)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatCost(row.totalCost)}
              </p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState message={`No ${title.toLowerCase()} data available.`} />
    )}
  </Section>
);

const ResponsiveTable = ({headers, rows}) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[720px] text-left">
      <thead>
        <tr className="border-b border-gray-200 dark:border-white/10">
          {headers.map((header) => (
            <th
              key={header}
              className="px-4 py-3 text-xs font-medium uppercase text-gray-500 dark:text-gray-400"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-white/5">
            {row.map((cell, cellIndex) => (
              <td
                key={`${rowIndex}-${cellIndex}`}
                className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default UserDetails;
