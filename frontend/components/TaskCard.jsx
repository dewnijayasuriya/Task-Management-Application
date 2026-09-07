"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "@/context/AuthContext";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function TaskCard({ task, onAssignSelf, onEdit, onAssignClick }) {
  const { user } = useAuth();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isAdmin = user.role === "ADMIN";
  const isCreator = task.creator?._id === user.id;
  const isAssignee = task.assignedUser?._id === user.id;
  const canManage = isAdmin || isCreator || isAssignee;
  const canSelfAssign = !isAdmin && !task.assignedUser;
  // Only owners/assignees/admins may change a task's status, so only they can drag it —
  // dragging an unmanageable task would optimistically move it then get reverted by the backend.
  const canDrag = canManage;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(canDrag ? listeners : {})}
      title={canDrag ? undefined : "You don't have permission to move this task"}
      className={`bg-white rounded-lg border border-slate-200 shadow-sm transition-shadow p-4 touch-none ${
        canDrag ? "hover:shadow-md cursor-grab active:cursor-grabbing" : "cursor-default"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-slate-900 text-sm leading-snug">{task.title}</h4>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-3">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
          Creator: {task.creator?.name || "Unknown"}
        </span>
        {task.assignedUser ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-50 text-brand-700">
            Assigned: {task.assignedUser.name}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700">
            Unassigned
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
        <span>Updated {formatDate(task.updatedAt)}</span>
      </div>

      <div
        className="flex items-center gap-2 pt-2 border-t border-slate-100"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {canManage && (
          <button
            onClick={() => onEdit(task)}
            className="text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Edit
          </button>
        )}
        {canSelfAssign && (
          <button
            onClick={() => onAssignSelf(task)}
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            Assign to me
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => onAssignClick(task)}
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            {task.assignedUser ? "Reassign" : "Assign"}
          </button>
        )}
      </div>
    </div>
  );
}
