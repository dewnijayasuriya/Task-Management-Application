"use client";

import { useState } from "react";
import Alert from "@/components/Alert";

export default function EditTaskModal({
  task,
  onClose,
  onSave,
  onDelete,
  canDelete,
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority || "MEDIUM");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave(task._id, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${task.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setError("");
    setDeleting(true);
    try {
      await onDelete(task._id);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to delete task.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="TODO">To Do</option>
              <option value="DOING">Doing</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete Task"}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
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
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
