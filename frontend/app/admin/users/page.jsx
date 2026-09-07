"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Alert from "@/components/Alert";
import Spinner from "@/components/Spinner";
import AssignTaskModal from "@/components/AssignTaskModal";
import { fetchAllUsers } from "@/services/userService";
import {
  fetchTasks,
  assignTask as assignTaskApi,
} from "@/services/taskService";

function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        role === "ADMIN"
          ? "bg-purple-50 text-purple-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  const statusStyles = {
    TODO: "bg-blue-50 text-blue-700",
    DOING: "bg-amber-50 text-amber-700",
    DONE: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        statusStyles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const priorityStyles = {
    LOW: "bg-slate-100 text-slate-600",
    MEDIUM: "bg-blue-50 text-blue-700",
    HIGH: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        priorityStyles[priority || "MEDIUM"]
      }`}
    >
      {priority || "MEDIUM"}
    </span>
  );
}

function AdminUsersContent() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningTask, setAssigningTask] = useState(null);

  const loadData = async () => {
    setError("");
    try {
      const [userData, taskData] = await Promise.all([
        fetchAllUsers(),
        fetchTasks(),
      ]);
      setUsers(userData);
      setTasks(taskData);
    } catch (err) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (taskId, userId) => {
    const updated = await assignTaskApi(taskId, userId);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
  };

  const taskCountForUser = (userId) =>
    tasks.filter((t) => t.assignedUser?._id === userId).length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          View all registered users and manage task assignments across the
          system.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      <div
        className="flex gap-1 border-b border-slate-200 mb-6"
        role="tablist"
        aria-label="Admin management views"
      >
        {[
          { id: "users", label: "All Users", count: users.length },
          { id: "tasks", label: "All Tasks", count: tasks.length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs text-slate-400">{tab.count}</span>
          </button>
        ))}
      </div>

      {activeTab === "users" ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Assigned Tasks
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {u.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {taskCountForUser(u.id)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Creator
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {t.title}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.creator?.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.assignedUser ? (
                        t.assignedUser.name
                      ) : (
                        <span className="text-amber-600">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setAssigningTask(t)}
                        className="text-brand-600 hover:text-brand-700 font-medium"
                      >
                        {t.assignedUser ? "Reassign" : "Assign"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {assigningTask && (
        <AssignTaskModal
          task={assigningTask}
          onClose={() => setAssigningTask(null)}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminUsersContent />
        </main>
      </div>
    </ProtectedRoute>
  );
}
