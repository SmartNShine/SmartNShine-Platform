import {useState, useEffect, useCallback, useMemo} from "react";
import {useNavigate} from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
  UserX,
  UserCheck,
  Trash2,
  Eye,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Mail,
} from "lucide-react";
import AdminEmailModal from "./components/AdminEmailModal";
import {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
} from "@/api/admin.api";
import {parseValidationErrors} from "@/utils/errorHandler";
import {ConfirmationModal} from "@/components/common/modals";

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    userId: null,
    userName: null,
    loading: false,
  });
  const [emailModal, setEmailModal] = useState({
    isOpen: false,
    email: "",
    name: "",
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllUsers(filters);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await updateUserStatus(userId, newStatus);
      fetchUsers();
      toast.success(
        <div>
          <div className="font-semibold">Status Updated!</div>
          <div className="text-sm opacity-90">
            User {newStatus === "active" ? "activated" : "deactivated"}{" "}
            successfully
          </div>
        </div>,
        {
          icon: newStatus === "active" ? "✅" : "🚫",
          duration: 2500,
          style: {
            borderRadius: "12px",
          },
        }
      );
    } catch (err) {
      toast.error(
        <div>
          <div className="font-semibold">Failed to Update Status</div>
          <div className="text-sm opacity-90">{parseValidationErrors(err)}</div>
        </div>,
        {
          icon: "❌",
          duration: 4000,
          style: {
            borderRadius: "12px",
          },
        }
      );
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      fetchUsers();
      toast.success(
        <div>
          <div className="font-semibold">Role Updated!</div>
          <div className="text-sm opacity-90">
            User role changed to {newRole} successfully
          </div>
        </div>,
        {
          icon: "👤",
          duration: 2500,
          style: {
            borderRadius: "12px",
          },
        }
      );
    } catch (err) {
      toast.error(
        <div>
          <div className="font-semibold">Failed to Update Role</div>
          <div className="text-sm opacity-90">{parseValidationErrors(err)}</div>
        </div>,
        {
          icon: "❌",
          duration: 4000,
          style: {
            borderRadius: "12px",
          },
        }
      );
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    // Open confirmation modal
    setDeleteModal({
      isOpen: true,
      userId,
      userName,
      loading: false,
    });
  };

  const confirmDeleteUser = async () => {
    const {userId, userName} = deleteModal;

    try {
      // Set loading state
      setDeleteModal((prev) => ({...prev, loading: true}));

      await deleteUser(userId);

      // Close modal
      setDeleteModal({
        isOpen: false,
        userId: null,
        userName: null,
        loading: false,
      });

      // Refresh users list
      fetchUsers();

      // Show success toast
      toast.success(
        <div>
          <div className="font-semibold">User Deleted Successfully!</div>
          <div className="text-sm opacity-90">
            {userName} has been removed from the system
          </div>
        </div>,
        {
          icon: "🗑️",
          duration: 3000,
          style: {
            borderRadius: "12px",
            background: "#10b981",
            color: "#fff",
          },
        }
      );
    } catch (err) {
      // Keep modal open but remove loading state
      setDeleteModal((prev) => ({...prev, loading: false}));

      toast.error(
        <div>
          <div className="font-semibold">Failed to Delete User</div>
          <div className="text-sm opacity-90">{parseValidationErrors(err)}</div>
        </div>,
        {
          icon: "❌",
          duration: 4000,
          style: {
            borderRadius: "12px",
          },
        }
      );
    }
  };

  const closeDeleteModal = () => {
    if (!deleteModal.loading) {
      setDeleteModal({
        isOpen: false,
        userId: null,
        userName: null,
        loading: false,
      });
    }
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({...prev, page: newPage}));
  };

  // Compute quick summary telemetry from current user list & pagination
  const userStats = useMemo(() => {
    const total = pagination.total || 0;
    const active = users.filter((u) => u.status === "active").length;
    const disabled = users.filter((u) => u.status === "disabled").length;
    const totalAiCost = users.reduce((acc, u) => acc + (u.aiCostInr || 0), 0);
    return {total, active, disabled, totalAiCost};
  }, [users, pagination]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded-full mb-2">
            <UserIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              Identity & Access Management
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            User Management
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage customer accounts, administrative roles, statuses, and individual AI spend
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold rounded-xl transition-all shadow-sm self-start sm:self-auto disabled:opacity-50"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Refresh Accounts</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Registered</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              {userStats.total.toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              All platform accounts
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <UserIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Accounts</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {userStats.active} <span className="text-xs font-normal text-zinc-400">on page</span>
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Enabled & authorized
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Disabled / Suspended</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {userStats.disabled} <span className="text-xs font-normal text-zinc-400">on page</span>
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Restricted access
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tracked AI Spend</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              ₹{userStats.totalAiCost.toFixed(2)}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Incurred across visible users
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by candidate name or email address..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                    page: 1,
                  }))
                }
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filters.role}
              onChange={(e) =>
                setFilters((prev) => ({...prev, role: e.target.value, page: 1}))
              }
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              <option value="">All Account Roles</option>
              <option value="user">User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                  page: 1,
                }))
              }
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="disabled">Disabled Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              <p className="text-xs font-medium text-zinc-500">Loading user accounts...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-sm font-medium">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">No users found matching query</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Candidate / User</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Usage Telemetry</th>
                    <th className="px-5 py-3.5">AI Spend</th>
                    <th className="px-4 py-3.5">Registration Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 text-xs font-semibold">
                            {user.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {user.name}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user._id, e.target.value)
                          }
                          className="text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                              {user.resumeCount || 0}
                            </span>
                            <span>resumes created</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                            <span className="font-mono font-medium text-sky-600 dark:text-sky-400">
                              {user.aiUsageCount || 0}
                            </span>
                            <span>AI requests</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{(user.aiCostInr || 0).toFixed(2)}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {user.aiTokensUsed ? `${(user.aiTokensUsed / 1000).toFixed(1)}k tokens` : "0 tokens"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              setEmailModal({
                                isOpen: true,
                                email: user.email,
                                name: user.name,
                              })
                            }
                            className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-all"
                            title="Send email to user"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/users/${user._id}`)}
                            className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-all"
                            title="Inspect user profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(
                                user._id,
                                user.status === "active" ? "disabled" : "active"
                              )
                            }
                            className={`p-1.5 rounded-lg transition-all ${
                              user.status === "active"
                                ? "text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            }`}
                            title={
                              user.status === "active" ? "Disable account" : "Enable account"
                            }
                          >
                            {user.status === "active" ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteUser(user._id, user.name)
                            }
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-zinc-50 dark:bg-zinc-900/60 px-5 py-3 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                Showing {(pagination.page - 1) * filters.limit + 1} -{" "}
                {Math.min(pagination.page * filters.limit, pagination.total)} of{" "}
                {pagination.total} users
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-zinc-700 dark:text-zinc-300 px-2 font-mono text-[11px]">
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={
          deleteModal.userName ? (
            <div className="space-y-3">
              <div className="text-base">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {deleteModal.userName}
                </span>
                ?
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500 dark:text-gray-400">
                This will delete:
              </div>
              <ul className="text-sm text-left list-disc list-inside text-gray-600 dark:text-gray-600 dark:text-gray-400 space-y-1">
                <li>User account and profile</li>
                <li>All resumes created by this user</li>
                <li>AI usage history and records</li>
              </ul>
              <div className="text-sm font-semibold text-red-600 dark:text-red-400 mt-3">
                ⚠️ This action cannot be undone!
              </div>
            </div>
          ) : (
            "Are you sure you want to delete this user?"
          )
        }
        confirmText="Delete User"
        cancelText="Cancel"
        type="danger"
        icon={Trash2}
        loading={deleteModal.loading}
      />

      <AdminEmailModal
        isOpen={emailModal.isOpen}
        onClose={() => setEmailModal({isOpen: false, email: "", name: ""})}
        initialEmail={emailModal.email}
        initialName={emailModal.name}
      />
    </div>
  );
};

export default UserManagement;
