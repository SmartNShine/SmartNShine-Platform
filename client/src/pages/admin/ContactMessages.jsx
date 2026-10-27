import {useState, useEffect} from "react";
import {
  MessageSquare,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Mail,
  CheckCircle,
  Clock,
  Archive,
  Trash2,
  Search,
  X,
  User,
  Building,
  Phone,
  Calendar,
  Tag,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getContactMessages,
  getContactStatistics,
  updateContactStatus,
  deleteContactMessage,
} from "@/api/admin.api";
import {parseValidationErrors} from "@/utils/errorHandler";
import {useToggle} from "@/hooks";

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, toggleLoading, setLoadingTrue, setLoadingFalse] =
    useToggle(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: "",
    category: "",
    search: "",
  });
  const [pagination, setPagination] = useState({total: 0, totalPages: 1});
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, toggleModal, setShowModalTrue, setShowModalFalse] =
    useToggle(false);
  const [updating, toggleUpdating, setUpdatingTrue, setUpdatingFalse] =
    useToggle(false);

  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, [filters]);

  const fetchMessages = async () => {
    try {
      setLoadingTrue();
      const response = await getContactMessages(filters);
      setMessages(response.data.data.messages);
      setPagination(response.data.data.pagination);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingFalse();
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getContactStatistics();
      setStats(response.data.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleStatusUpdate = async (id, status, notes = "") => {
    try {
      setUpdatingTrue();
      await updateContactStatus(id, {status, notes});
      fetchMessages();
      fetchStats();
      setShowModalFalse();
      setSelectedMessage(null);
      toast.success("Message status updated successfully!", {
        icon: "✅",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status: " + parseValidationErrors(error), {
        icon: "❌",
        duration: 3000,
      });
    } finally {
      setUpdatingFalse();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteContactMessage(id);
        fetchMessages();
        fetchStats();
        setShowModalFalse();
        toast.success("Message deleted successfully!", {
          icon: "🗑️",
          duration: 2000,
        });
      } catch (error) {
        console.error("Error deleting message:", error);
        toast.error(
          "Failed to delete message: " + parseValidationErrors(error),
          {
            icon: "❌",
            duration: 3000,
          }
        );
      }
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      read: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      replied:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      archived:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return styles[status] || styles.new;
  };

  const getCategoryBadge = (category) => {
    const styles = {
      general: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      support:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      feedback:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      business:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      "bug-report":
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      "feature-request":
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    };
    return styles[category] || styles.general;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="px-3 py-1 bg-primary-50 dark:bg-primary-500/15 border border-primary-200 dark:border-primary-500/25 rounded-full text-primary-700 dark:text-primary-300 text-xs font-medium inline-block mb-3">
          Messages
        </span>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Contact Messages
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage and respond to user contact messages
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-zinc-950 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Enquiries</p>
              <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">New / Unread</p>
              <p className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1">
                {stats.byStatus.new || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Read</p>
              <p className="text-2xl font-bold font-mono text-zinc-700 dark:text-zinc-300 mt-1">
                {stats.byStatus.read || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Replied</p>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.byStatus.replied || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Recent (7 Days)</p>
              <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                {stats.recentCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-black rounded-2xl p-6 border border-gray-200 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Name, email, subject..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({...filters, search: e.target.value, page: 1})
                }
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({...filters, status: e.target.value, page: 1})
              }
              className="w-full px-4 py-2.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
            >
              <option value="" className="bg-white dark:bg-gray-900">
                All Statuses
              </option>
              <option value="new" className="bg-white dark:bg-gray-900">
                New
              </option>
              <option value="read" className="bg-white dark:bg-gray-900">
                Read
              </option>
              <option value="replied" className="bg-white dark:bg-gray-900">
                Replied
              </option>
              <option value="archived" className="bg-white dark:bg-gray-900">
                Archived
              </option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({...filters, category: e.target.value, page: 1})
              }
              className="w-full px-4 py-2.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
            >
              <option value="" className="bg-white dark:bg-gray-900">
                All Categories
              </option>
              <option value="general" className="bg-white dark:bg-gray-900">
                General
              </option>
              <option value="support" className="bg-white dark:bg-gray-900">
                Support
              </option>
              <option value="feedback" className="bg-white dark:bg-gray-900">
                Feedback
              </option>
              <option value="business" className="bg-white dark:bg-gray-900">
                Business
              </option>
              <option value="bug-report" className="bg-white dark:bg-gray-900">
                Bug Report
              </option>
              <option value="feature-request" className="bg-white dark:bg-gray-900">
                Feature Request
              </option>
            </select>
          </div>

          {/* Per Page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Per Page
            </label>
            <select
              value={filters.limit}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  limit: parseInt(e.target.value),
                  page: 1,
                })
              }
              className="w-full px-4 py-2.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
            >
              <option value="10" className="bg-white dark:bg-gray-900">
                10
              </option>
              <option value="20" className="bg-white dark:bg-gray-900">
                20
              </option>
              <option value="50" className="bg-white dark:bg-gray-900">
                50
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center animate-pulse">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400">No contact messages found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {messages.map((message) => (
                  <tr
                    key={message._id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {message.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {message.email}
                        </div>
                        {message.company && (
                          <div className="text-xs text-gray-500">
                            {message.company}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-md truncate">
                        {message.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${getCategoryBadge(
                          message.category
                        )}`}
                      >
                        {message.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                          message.status
                        )}`}
                      >
                        {message.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedMessage(message);
                          setShowModalTrue();
                        }}
                        className="p-2 hover:bg-primary-50 dark:hover:bg-primary-500/20 rounded-xl text-primary-700 dark:text-primary-400 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-white/5">
            <div className="text-sm text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} messages
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({...filters, page: filters.page - 1})}
                disabled={filters.page === 1}
                className="px-3 py-1.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setFilters({...filters, page: filters.page + 1})}
                disabled={filters.page === pagination.totalPages}
                className="px-3 py-1.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-black/70 backdrop-blur-sm"
              onClick={setShowModalFalse}
            ></div>

            <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-black shadow-2xl rounded-2xl border border-gray-200 dark:border-white/10">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Contact Message Details
                </h3>
                <button
                  onClick={setShowModalFalse}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-500/20 rounded-lg">
                      <User className="w-5 h-5 text-primary-700 dark:text-primary-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedMessage.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedMessage.email}
                      </p>
                    </div>
                  </div>

                  {selectedMessage.phone && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Phone className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Phone</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedMessage.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedMessage.company && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Building className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Company</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedMessage.company}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Received</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedMessage.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Tag className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Category</p>
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${getCategoryBadge(
                          selectedMessage.category
                        )}`}
                      >
                        {selectedMessage.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Subject</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedMessage.subject}
                  </p>
                </div>

                {/* Message */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Message</p>
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>

                {/* Current Status */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Current Status</p>
                  <span
                    className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full ${getStatusBadge(
                      selectedMessage.status
                    )}`}
                  >
                    {selectedMessage.status}
                  </span>
                </div>

                {/* Notes */}
                {selectedMessage.notes && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Admin Notes</p>
                    <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                      <p className="text-gray-900 dark:text-white">{selectedMessage.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex flex-wrap gap-3 bg-gray-50 dark:bg-white/5">
                {selectedMessage.status !== "read" && (
                  <button
                    onClick={() =>
                      handleStatusUpdate(selectedMessage._id, "read")
                    }
                    disabled={updating}
                    className="px-4 py-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all disabled:opacity-50 flex items-center gap-2 font-medium"
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    Mark as Read
                  </button>
                )}

                {selectedMessage.status !== "replied" && (
                  <button
                    onClick={() =>
                      handleStatusUpdate(selectedMessage._id, "replied")
                    }
                    disabled={updating}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm"
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Mark as Replied
                  </button>
                )}

                {selectedMessage.status !== "archived" && (
                  <button
                    onClick={() =>
                      handleStatusUpdate(selectedMessage._id, "archived")
                    }
                    disabled={updating}
                    className="px-4 py-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all disabled:opacity-50 flex items-center gap-2 font-medium"
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                    Archive
                  </button>
                )}

                <button
                  onClick={() => handleDelete(selectedMessage._id)}
                  className="px-4 py-2 bg-white dark:bg-black border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex items-center gap-2 font-medium ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMessages;
