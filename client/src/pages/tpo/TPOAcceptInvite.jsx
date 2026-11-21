import {useState, useEffect} from "react";
import {useSearchParams, useNavigate, Link} from "react-router-dom";
import {tpoStudentsAPI} from "@/api/tpo.api";
import {useAuth} from "@/context/AuthContext";
import {
  GraduationCap,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function TPOAcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const {user} = useAuth();

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invitation token found in link.");
      setLoading(false);
      return;
    }

    tpoStudentsAPI
      .acceptInvite({token})
      .then((res) => {
        setInviteData(res.data.data);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || "Invalid or expired invitation token."
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleGiveConsent = async () => {
    if (!user) {
      toast.error("Please log in to your SmartNShine account first.");
      navigate("/login", {
        state: {returnTo: `/tpo/accept-invite?token=${token}`},
      });
      return;
    }

    try {
      setSubmitting(true);
      await tpoStudentsAPI.giveConsent({token});
      toast.success(
        "Successfully enrolled in institution with consent granted!"
      );
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit consent.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full mx-auto space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
          <GraduationCap className="w-9 h-9 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Institutional Career Preparation Link
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect your SmartNShine profile with your college placement cell
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-left shadow-2xl">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Verifying invitation...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
              <p className="text-xs text-red-300 font-semibold">{error}</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Inviting Institution
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  {inviteData?.institution?.name}
                </h3>
                {inviteData?.student?.name && (
                  <p className="text-xs text-slate-400">
                    Invited:{" "}
                    <strong className="text-slate-200">
                      {inviteData.student.name}
                    </strong>{" "}
                    ({inviteData.student.email})
                  </p>
                )}
              </div>

              {/* Data Privacy & Consent Notice */}
              <div className="space-y-3 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Student Privacy Protection</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  By consenting, you allow your institution's Placement Officers
                  (TPO) to view your placement readiness scores, resume
                  completion metrics, and AI mock interview practice analytics.
                </p>
              </div>

              <button
                onClick={handleGiveConsent}
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <span>Recording Consent...</span>
                ) : (
                  <>
                    <span>Accept & Link Institutional Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
