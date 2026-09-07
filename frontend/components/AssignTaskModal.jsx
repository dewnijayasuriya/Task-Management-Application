"use client";

import { useEffect, useState } from "react";
import Alert from "@/components/Alert";
import Spinner from "@/components/Spinner";
import { fetchAllUsers } from "@/services/userService";

export default function AssignTaskModal({ task, onClose, onAssign }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(task.assignedUser?._id || "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await fetchAllUsers();
        setUsers(data);
      } catch (err) {
        setError(err.message || "Failed to load users.");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedUserId) {
      setError("Please select a user to assign this task to.");
      return;
    }

    setSubmitting(true);
    try {
      await onAssign(task._id, selectedUserId);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to assign task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {task.assignedUser ? "Reassign Task" : "Assign Task"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Task: <span className="font-medium text-slate-700">{task.title}</span>
        </p>

        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select user
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Select a user --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) {u.role === "ADMIN" ? "- Admin" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60"
              >
                {submitting ? "Assigning..." : "Assign"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
