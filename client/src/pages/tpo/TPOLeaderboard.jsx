import {useState, useEffect} from "react";
import {Link} from "react-router-dom";
import {tpoReadinessAPI} from "@/api/tpo.api";
import {
  Trophy,
  Medal,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  FileText,
  Mic2,
} from "lucide-react";

export default function TPOLeaderboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tpoReadinessAPI
      .getInstitution()
      .then((res) => {
        setStudents(res.data.data?.students || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const topThree = students.slice(0, 3);
  const remaining = students.slice(3);

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          Career Readiness Leaderboard
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Recognize top-performing students across resume completeness and
          interview excellence.
        </p>
      </div>

      {/* Top 3 Podium */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* #2 Rank */}
          <div className="order-2 md:order-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-center space-y-3 relative hover:border-zinc-200 dark:border-zinc-700 transition-all">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 border-2 border-slate-500 text-zinc-600 dark:text-zinc-300 font-black text-lg flex items-center justify-center mx-auto shadow-lg">
              2
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-white text-base truncate">
              {topThree[1].name}
            </h3>
            <span className="text-2xl font-black text-zinc-600 dark:text-zinc-300">
              {topThree[1].readinessScore}%
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Roll: {topThree[1].rollNumber || "N/A"}
            </p>
          </div>

          {/* #1 Rank (Golden) */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 to-slate-900 border border-amber-500/40 rounded-3xl p-8 text-center space-y-3 relative shadow-xl shadow-amber-500/5 -translate-y-2">
            <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30">
              👑
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-white text-lg truncate">
              {topThree[0].name}
            </h3>
            <span className="text-3xl font-black text-amber-400">
              {topThree[0].readinessScore}%
            </span>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-semibold">
              Cohort Champion
            </p>
          </div>

          {/* #3 Rank */}
          <div className="order-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-center space-y-3 relative hover:border-zinc-200 dark:border-zinc-700 transition-all">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 border-2 border-amber-700 text-amber-600 font-black text-lg flex items-center justify-center mx-auto shadow-lg">
              3
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-white text-base truncate">
              {topThree[2].name}
            </h3>
            <span className="text-2xl font-black text-amber-600">
              {topThree[2].readinessScore}%
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Roll: {topThree[2].rollNumber || "N/A"}
            </p>
          </div>
        </div>
      )}

      {/* Complete Leaderboard List */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
          Cohort Rankings
        </h3>

        {students.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 py-10 text-center">
            No assessed students to display on leaderboard.
          </p>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
            {students.map((s, idx) => (
              <div
                key={s.userId}
                className="py-3.5 flex items-center justify-between hover:bg-zinc-100 dark:bg-zinc-900/30 px-3 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 font-mono text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    #{idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {s.name?.[0]?.toUpperCase() || "S"}
                  </div>
                  <div>
                    <Link
                      to={`/tpo/students/${s.userId}`}
                      className="font-semibold text-zinc-900 dark:text-white hover:text-indigo-400 transition-colors text-sm"
                    >
                      {s.name}
                    </Link>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Roll: {s.rollNumber || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-base font-black text-indigo-400">
                    {s.readinessScore !== null ? `${s.readinessScore}%` : "—"}
                  </span>
                  <Link
                    to={`/tpo/students/${s.userId}`}
                    className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
