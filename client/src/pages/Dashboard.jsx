import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { resumeAPI } from "@/api/api";
import { parseValidationErrors } from "@/utils/errorHandler";
import SEO from "@/components/common/SEO";
import {
  FileText,
  Trash2,
  CheckCircle2,
  CircleX,
  NotepadText,
  Lock,
} from "lucide-react";
import PaymentModal from "@/components/common/PaymentModal";
import DashboardBanner from "@/components/dashboard/DashboardBanner";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ResumeCard from "@/components/dashboard/ResumeCard";
import EmptyResumeState from "@/components/dashboard/EmptyResumeState";
import EditResumeModal from "@/components/dashboard/EditResumeModal";

export default function Dashboard() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingResume, setEditingResume] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [unlockPaymentData, setUnlockPaymentData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchResumes();
  }, [user, navigate]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await resumeAPI.list();
      setResumes(response.data.resumes || []);
    } catch (err) {
      setError("Failed to load resumes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;

    try {
      await resumeAPI.delete(id);
      setResumes(resumes.filter((r) => r._id !== id));
      toast.success("Resume deleted successfully!", {
        icon: <Trash2 className="w-4 h-4 text-red-600" />,
        duration: 2000,
      });
    } catch (err) {
      toast.error("Failed to delete resume", {
        icon: <CircleX className="w-4 h-4 text-red-600" />,
        duration: 3000,
      });
      console.error(err);
    }
  };

  const handleLoad = async (id) => {
    try {
      const response = await resumeAPI.getById(id);
      navigate("/editor", {
        state: {
          resumeData: response.data,
          fromDashboard: true,
        },
      });
    } catch (err) {
      toast.error("Failed to load resume", {
        icon: <CircleX className="w-4 h-4 text-red-600" />,
        duration: 3000,
      });
      console.error(err);
    }
  };

  const handleUnlockOneTime = (resume) => {
    setUnlockPaymentData({
      tier: "one-time",
      plan: "one-time",
      resumeId: resume._id,
      resumeTitle: resume.resumeTitle || resume.name || "Untitled Resume",
    });
  };

  const getResumeAccessBadge = (resume) => {
    if (resume.access?.upgradeRequired) {
      return {
        label: "Paid actions locked",
        icon: Lock,
        className:
          "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-500/20",
      };
    }

    if (resume.access?.accessTier === "pro") {
      return {
        label: "Pro access",
        icon: CheckCircle2,
        className:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300 border border-emerald-500/20",
      };
    }

    if (resume.access?.accessTier === "one-time") {
      return {
        label: "One-time access",
        icon: CheckCircle2,
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300 border border-blue-500/20",
      };
    }

    return {
      label: "Free access",
      icon: FileText,
      className:
        "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 border border-gray-200 dark:border-white/[0.08]",
    };
  };

  const handleEditInfo = (resume) => {
    setEditingResume(resume);
    setEditForm({
      name: resume.resumeTitle || resume.name || "Untitled Resume",
      description: resume.description || "",
    });
  };

  const handleSaveInfo = async () => {
    if (!editForm.name.trim()) {
      toast.error("Resume title is required", {
        icon: <NotepadText className="w-4 h-4 text-amber-600" />,
        duration: 2000,
      });
      return;
    }

    try {
      await resumeAPI.update(editingResume._id, {
        resumeTitle: editForm.name,
        description: editForm.description,
      });
      setResumes(
        resumes.map((r) =>
          r._id === editingResume._id
            ? {
                ...r,
                resumeTitle: editForm.name,
                description: editForm.description,
              }
            : r
        )
      );
      setEditingResume(null);
      setEditForm({ name: "", description: "" });
      toast.success("Resume info updated successfully!", {
        icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
        duration: 2000,
      });
    } catch (err) {
      toast.error(
        "Failed to update resume info: " + parseValidationErrors(err),
        {
          icon: <CircleX className="w-4 h-4 text-red-600" />,
          duration: 4000,
        }
      );
      console.error(err);
    }
  };

  const lastUpdatedText =
    resumes.length > 0
      ? new Date(resumes[0].updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "N/A";

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-3 border-gray-200 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 font-bold tracking-wide uppercase">
            Loading your resumes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <SEO
        title="My Resumes | SmartNShine"
        description="Manage and build your tailored AI resumes, download PDF formats, and check ATS optimization scores."
        noindex={true}
      />

      <main className="flex-1 workspace-container py-8 space-y-8">
        {/* Banner Section */}
        <DashboardBanner
          userName={user?.name}
          totalResumes={resumes.length}
        />

        {/* Stats Section */}
        <DashboardStats
          totalResumes={resumes.length}
          lastUpdated={lastUpdatedText}
          proCount={resumes.filter((r) => r.access?.accessTier === "pro").length}
        />

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Resumes Content Section */}
        {resumes.length === 0 ? (
          <EmptyResumeState />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Your Saved Resumes ({resumes.length})
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {resumes.map((resume) => (
                <ResumeCard
                  key={resume._id}
                  resume={resume}
                  onLoad={handleLoad}
                  onEditInfo={handleEditInfo}
                  onDelete={handleDelete}
                  onUnlockOneTime={handleUnlockOneTime}
                  getResumeAccessBadge={getResumeAccessBadge}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Edit Resume Title & Notes Modal */}
      {editingResume && (
        <EditResumeModal
          editForm={editForm}
          setEditForm={setEditForm}
          onClose={() => setEditingResume(null)}
          onSave={handleSaveInfo}
        />
      )}

      {/* Payment Unlock Modal */}
      {unlockPaymentData && (
        <PaymentModal
          tier={unlockPaymentData.tier}
          plan={unlockPaymentData.plan}
          resumeId={unlockPaymentData.resumeId}
          resumeTitle={unlockPaymentData.resumeTitle}
          onClose={() => setUnlockPaymentData(null)}
          onSuccess={() => {
            setUnlockPaymentData(null);
            fetchResumes();
          }}
        />
      )}
    </div>
  );
}
