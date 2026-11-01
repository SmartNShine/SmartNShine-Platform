import { useState, useEffect, useRef } from "react";
import {
  Activity,
  Clock,
  RefreshCw,
  Terminal,
  ShieldAlert,
  Search,
  Filter,
  Trash2,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Radio,
} from "lucide-react";
import { getAdminLogs, getSystemLogs, clearSystemLogs } from "@/api/admin.api";
import toast from "react-hot-toast";

const AdminLogs = () => {
  const [activeTab, setActiveTab] = useState("system"); // 'system' | 'audit'

  // System logs state
  const [systemLogs, setSystemLogs] = useState([]);
  const [systemLoading, setSystemLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState("app"); // 'app' | 'error' | 'interview' | 'memory'
  const [selectedLevel, setSelectedLevel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLivePolling, setIsLivePolling] = useState(false);
  const [expandedLogIdx, setExpandedLogIdx] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  // Admin audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);

  const pollIntervalRef = useRef(null);

  // Fetch system logs
  const fetchSystemLogs = async (silent = false) => {
    try {
      if (!silent) setSystemLoading(true);
      const params = {
        stream: selectedStream,
        limit: 150,
      };
      if (selectedLevel) params.level = selectedLevel;
      if (searchQuery.trim()) params.sessionId = searchQuery.trim();

      const response = await getSystemLogs(params);
      if (response.data?.success) {
        setSystemLogs(response.data.data || []);
      }
    } catch (err) {
      if (!silent) console.error("Error fetching system logs:", err);
    } finally {
      if (!silent) setSystemLoading(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const response = await getAdminLogs();
      setAuditLogs(response.data?.data?.logs || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "system") {
      fetchSystemLogs();
    } else {
      fetchAuditLogs();
    }
  }, [activeTab, selectedStream, selectedLevel]);

  // Live polling handler
  useEffect(() => {
    if (isLivePolling && activeTab === "system") {
      pollIntervalRef.current = setInterval(() => {
        fetchSystemLogs(true);
      }, 3000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isLivePolling, activeTab, selectedStream, selectedLevel, searchQuery]);

  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear system log files?")) return;
    try {
      await clearSystemLogs();
      toast.success("System logs cleared");
      fetchSystemLogs();
    } catch (err) {
      toast.error("Failed to clear logs");
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
    toast.success("Copied to clipboard", { duration: 1500 });
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case "ERROR":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "WARN":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "INTERVIEW":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "PROCTOR":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      default:
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
  };

  const filteredLogs = systemLogs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.message?.toLowerCase().includes(q) ||
      log.tag?.toLowerCase().includes(q) ||
      JSON.stringify(log.meta || {}).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-3">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-400">Observability & Diagnostics</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            System & Activity Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time server logs, AI interview turn traces, proctoring events, and admin audit history.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl">
          <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "system"
                ? "bg-white dark:bg-indigo-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>AI & System Diagnostics</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "audit"
                ? "bg-white dark:bg-indigo-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Admin Actions</span>
          </button>
        </div>
      </div>

      {/* SYSTEM DIAGNOSTICS VIEW */}
      {activeTab === "system" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-black/60 rounded-2xl border border-gray-200 dark:border-white/10">
            {/* Stream Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-gray-400 font-medium mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Stream:
              </span>
              {[
                { id: "app", label: "All Logs (app.log)" },
                { id: "interview", label: "AI Interview (interview.log)" },
                { id: "error", label: "Errors Only (error.log)" },
                { id: "memory", label: "Live Ring Buffer" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStream(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedStream === s.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Level Filter, Search & Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-200 focus:outline-none"
              >
                <option value="">All Levels</option>
                <option value="ERROR">ERROR</option>
                <option value="WARN">WARN</option>
                <option value="INTERVIEW">INTERVIEW</option>
                <option value="PROCTOR">PROCTOR</option>
                <option value="INFO">INFO</option>
              </select>

              {/* Search Query */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by session ID or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none"
                />
              </div>

              {/* Live Poll Toggle */}
              <button
                onClick={() => setIsLivePolling((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isLivePolling
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse"
                    : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:text-white"
                }`}
                title="Auto-refresh logs every 3 seconds"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{isLivePolling ? "Live" : "Poll"}</span>
              </button>

              {/* Manual Refresh */}
              <button
                onClick={() => fetchSystemLogs()}
                disabled={systemLoading}
                className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-gray-600 dark:text-gray-300 transition-all"
                title="Refresh logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${systemLoading ? "animate-spin text-indigo-500" : ""}`} />
              </button>

              {/* Clear Logs */}
              <button
                onClick={handleClearLogs}
                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all"
                title="Clear log files"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Logs Terminal View */}
          <div className="bg-[#0A0D14] border border-white/10 rounded-2xl p-4 font-mono text-xs shadow-2xl overflow-hidden">
            {systemLoading && !isLivePolling ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                <p className="text-neutral-400 text-xs font-sans">Streaming system logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-20 font-sans">
                <Terminal className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-400">No logs found for the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[650px] overflow-y-auto pr-1">
                {filteredLogs.map((log, idx) => {
                  const isExpanded = expandedLogIdx === idx;
                  const hasMeta = log.meta && Object.keys(log.meta).length > 0;
                  const logString = JSON.stringify(log, null, 2);

                  return (
                    <div
                      key={idx}
                      className="group rounded-xl border border-white/[0.04] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] transition-all p-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          {/* Timestamp */}
                          <span className="text-neutral-500 whitespace-nowrap text-[11px] pt-0.5">
                            {log.timestamp ? log.timestamp.substring(11, 19) : "--:--:--"}
                          </span>

                          {/* Level Badge */}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getLevelBadge(
                              log.level
                            )}`}
                          >
                            {log.level || "INFO"}
                          </span>

                          {/* Tag */}
                          {log.tag && (
                            <span className="text-indigo-400 font-medium text-[11px] truncate max-w-[200px]">
                              [{log.tag}]
                            </span>
                          )}

                          {/* Message */}
                          <span className="text-neutral-200 text-xs break-all flex-1">
                            {log.message}
                          </span>
                        </div>

                        {/* Actions: Expand & Copy */}
                        <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                          {hasMeta && (
                            <button
                              onClick={() => setExpandedLogIdx(isExpanded ? null : idx)}
                              className="text-neutral-400 hover:text-white p-1 rounded hover:bg-white/10"
                              title={isExpanded ? "Collapse metadata" : "Expand metadata"}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => copyToClipboard(logString, idx)}
                            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-white/10"
                            title="Copy log entry"
                          >
                            {copiedIdx === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable JSON Metadata Drawer */}
                      {isExpanded && hasMeta && (
                        <div className="mt-2.5 pt-2 border-t border-white/[0.08] text-[11px]">
                          <pre className="bg-black/50 p-2.5 rounded-lg text-emerald-400/90 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.meta, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN AUDIT TRAIL VIEW */}
      {activeTab === "audit" && (
        <div className="bg-white dark:bg-black rounded-2xl p-6 border border-gray-200 dark:border-white/10">
          {auditLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              <p className="text-xs text-zinc-500">Loading audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400">No activity logs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-black text-sm font-medium">
                      {log.adminId?.name?.charAt(0) || "A"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{log.description}</p>
                      <p className="text-sm text-gray-400">by {log.adminId?.name || "Unknown Admin"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
