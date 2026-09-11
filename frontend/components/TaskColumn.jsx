"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskCard from "@/components/TaskCard";

const COLUMN_STYLES = {
  TODO: { header: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  DOING: { header: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  DONE: { header: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

export default function TaskColumn({
  id,
  title,
  tasks,
  onAssignSelf,
  onEdit,
  onAssignClick,
}) {
  const { setNodeRef, isOver } = useDroppable({ id }); //setNodeRef → connects the HTML element to dnd-kit. isOver → tells us if a task is currently being dragged over the column.
  const styles = COLUMN_STYLES[id] || COLUMN_STYLES.TODO;

  return (
    <div className="flex flex-col w-full sm:flex-1 sm:min-w-0 bg-slate-50 rounded-xl border border-slate-200">
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-t-xl ${styles.header}`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <span className="text-xs font-medium bg-white/70 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-260px)] overflow-y-auto transition-colors rounded-b-xl ${
          isOver ? "bg-brand-50/50" : ""
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-10 border border-dashed border-slate-200 rounded-lg">
              No tasks here yet
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onAssignSelf={onAssignSelf}
                onEdit={onEdit}
                onAssignClick={onAssignClick}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
