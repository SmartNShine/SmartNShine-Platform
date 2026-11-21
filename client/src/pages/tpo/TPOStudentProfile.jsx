import {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import TPO3DButton from "@/components/tpo/TPO3DButton";
import {tpoStudentsAPI} from "@/api/tpo.api";
import ReadinessGauge from "@/components/tpo/ReadinessGauge";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Building2,
  GraduationCap,
  Sparkles,
  FileText,
  Mic2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Award,
  Clock,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

export default function TPOStudentProfile() {
  const {studentId} = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await tpoStudentsAPI.getProfile(studentId);
        setProfile(res.data.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load student profile.");
      } finally {
        setLoading(false);
      }
    };

    if (studentId) fetchProfile();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-zinc-500 dark:text-zinc-400">Student profile could not be found.</p>
        <TPO3DButton to="/tpo/students" variant="surface" size="sm">
          Return to Student Directory
        </TPO3DButton>
      </div>
    );
  }

  const {
    student,
    enrollment,
    readiness,
    resumes = [],
    interviews = [],
  } = profile;
  const comps = readiness?.components || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Back button */}
      <div>
        <TPO3DButton to="/tpo/students" variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students</span>
        </TPO3DButton>
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-lg shadow-indigo-600/30 flex-shrink-0">
            {student?.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {student?.name}
              </h2>
              {enrollment?.status === "active" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Consent Active
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{student?.email}</span>
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
              <span>
                Roll:{" "}
                <strong className="text-white">
                  {enrollment?.rollNumber || "N/A"}
                </strong>
              </span>
              <span>•</span>
              <span>
                Dept:{" "}
                <strong className="text-white">
                  {enrollment?.department?.name || "General"}
                </strong>
              </span>
              <span>•</span>
              <span>
                Batch:{" "}
                <strong className="text-white">
                  {enrollment?.batch?.name || "N/A"}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Readiness Snapshot Quick Gauge */}
        <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
          <ReadinessGauge
            score={readiness?.overallScore}
            size="sm"
            showLabel={false}
          />
          <div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              Placement Readiness
            </span>
            <span className="text-base font-bold text-zinc-900 dark:text-white">
              {readiness?.overallScore !== null
                ? `${readiness.overallScore}/100`
                : "Pending"}
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
              Trend:{" "}
              <strong className="text-indigo-400">
                {readiness?.trend || "new"}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Component Breakdown Cards (4 Pillars) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Pillar 1: Resume Quality */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">
              Resume Quality
            </span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {comps.resume?.score !== null
              ? `${comps.resume.score}%`
              : "No Resume"}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
            <p>
              Resumes Created:{" "}
              <strong className="text-white">
                {comps.resume?.details?.totalResumes || 0}
              </strong>
            </p>
            <p>
              Skills Listed:{" "}
              <strong className="text-white">
                {comps.resume?.details?.skillCount || 0}
              </strong>
            </p>
          </div>
        </div>

        {/* Pillar 2: Interview Performance */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">
              Interview Score
            </span>
            <Mic2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {comps.interview?.score !== null
              ? `${comps.interview.score}%`
              : "No Mocks"}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
            <p>
              Total Mocks:{" "}
              <strong className="text-white">
                {comps.interview?.details?.totalInterviews || 0}
              </strong>
            </p>
            <p>
              Tech Knowledge:{" "}
              <strong className="text-white">
                {comps.interview?.details?.technicalScore
                  ? `${comps.interview.details.technicalScore}%`
                  : "N/A"}
              </strong>
            </p>
          </div>
        </div>

        {/* Pillar 3: Technical Skills */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">
              Tech Readiness
            </span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {comps.technical?.score !== null
              ? `${comps.technical.score}%`
              : "Evaluating"}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
            <p>
              Verified Skills:{" "}
              <strong className="text-white">
                {comps.technical?.details?.skillsFromResume?.length || 0}
              </strong>
            </p>
            <p>
              Weight Factor: <strong className="text-white">20%</strong>
            </p>
          </div>
        </div>

        {/* Pillar 4: Engagement */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">
              Platform Activity
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {comps.engagement?.score !== null
              ? `${comps.engagement.score}%`
              : "10%"}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
            <p>
              Weight Factor: <strong className="text-white">10%</strong>
            </p>
            <p>
              Last Active:{" "}
              <strong className="text-white">
                {student?.lastLogin
                  ? new Date(student.lastLogin).toLocaleDateString()
                  : "Never"}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Strengths & Recommendations Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Demonstrated Strengths
          </h3>
          {readiness?.strengths?.length > 0 ? (
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
              {readiness.strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1 font-bold">✓</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Complete more assessments to surface career strengths.
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Recommended Improvement Actions
          </h3>
          {readiness?.recommendations?.length > 0 ? (
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
              {readiness.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1 font-bold">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Student is performing well across core metrics.
            </p>
          )}
        </div>
      </div>

      {/* Resumes and Mock Interviews Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumes Created */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Resumes Created ({resumes.length})
            </h3>
          </div>

          {resumes.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 py-6 text-center">
              No resumes created by this student yet.
            </p>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {resumes.map((r) => (
                <div
                  key={r._id}
                  className="py-3.5 flex items-center justify-between text-xs sm:text-sm"
                >
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white">{r.title}</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Template:{" "}
                      <span className="font-mono text-indigo-400">
                        {r.templateId}
                      </span>{" "}
                      • Skills: {r.skillsCount}
                    </p>
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Updated {new Date(r.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mock Interviews Completed */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-blue-400" />
              Mock Interview Results ({interviews.length})
            </h3>
          </div>

          {interviews.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 py-6 text-center">
              No mock interviews completed by this student yet.
            </p>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {interviews.map((intv) => (
                <div
                  key={intv._id}
                  className="py-3.5 flex items-center justify-between text-xs sm:text-sm"
                >
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white">
                      {intv.role || "Software Engineer"} ({intv.interviewType})
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Recommendation:{" "}
                      <strong className="text-indigo-400">
                        {intv.hiringRecommendation?.recommendation ||
                          "Completed"}
                      </strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-white">
                      {intv.overallScore}%
                    </span>
                    <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">
                      {new Date(intv.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
