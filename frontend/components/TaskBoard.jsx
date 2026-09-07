"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import TaskColumn from "@/components/TaskColumn";
import TaskCard from "@/components/TaskCard";
import CreateTaskModal from "@/components/CreateTaskModal";
import EditTaskModal from "@/components/EditTaskModal";
import AssignTaskModal from "@/components/AssignTaskModal";
import Alert from "@/components/Alert";
import Spinner from "@/components/Spinner";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTasks,
  createTask as createTaskApi,
  updateTask as updateTaskApi,
  updateTaskStatus as updateTaskStatusApi,
  assignTask as assignTaskApi,
  deleteTask as deleteTaskApi,
} from "@/services/taskService";

const COLUMNS = [
  { id: "TODO", title: "To Do" },
  { id: "DOING", title: "Doing" },
  { id: "DONE", title: "Done" },
];

export default function TaskBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [assigningTask, setAssigningTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const loadTasks = async () => {
    setError("");
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tasksByStatus = useMemo(() => {
    const grouped = { TODO: [], DOING: [], DONE: [] };
    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    }
    return grouped;
  }, [tasks]);

  const findTaskById = (id) => tasks.find((t) => t._id === id);
  const findColumnOfTask = (id) => {
    const task = findTaskById(id);
    return task ? task.status : null;
  };

  const handleDragStart = (event) => {
    const task = findTaskById(event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const sourceStatus = findColumnOfTask(activeId);

    // The drop target is either a column id (TODO/DOING/DONE) or another task's id.
    const overId = over.id;
    const isOverColumn = COLUMNS.some((c) => c.id === overId);
    const destStatus = isOverColumn ? overId : findColumnOfTask(overId);

    if (!destStatus || sourceStatus === destStatus) return;

    const previousTasks = tasks;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === activeId ? { ...t, status: destStatus } : t))
    );

    try {
      const updatedTask = await updateTaskStatusApi(activeId, destStatus);
      setTasks((prev) => prev.map((t) => (t._id === activeId ? updatedTask : t)));
    } catch (err) {
      // Revert on failure and surface the error
      setTasks(previousTasks);
      setError(err.message || "Failed to update task status. Please try again.");
    }
  };

  const handleCreate = async (payload) => {
    const newTask = await createTaskApi(payload);
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleSaveEdit = async (id, updates) => {
    const updated = await updateTaskApi(id, updates);
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
  };

  const handleDelete = async (id) => {
    await deleteTaskApi(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  const handleAssignSelf = async (task) => {
    setError("");
    try {
      const updated = await assignTaskApi(task._id, user.id);
      setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)));
    } catch (err) {
      setError(err.message || "Failed to assign task.");
    }
  };

  const handleAdminAssign = async (id, userId) => {
    const updated = await assignTaskApi(id, userId);
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
          <p className="text-sm text-slate-500 mt-1">
            Drag and drop tasks between columns to update their status.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-colors"
        >
          + Create Task
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col sm:flex-row gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <TaskColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={tasksByStatus[col.id]}
              onAssignSelf={handleAssignSelf}
              onEdit={setEditingTask}
              onAssignClick={setAssigningTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              onAssignSelf={() => {}}
              onEdit={() => {}}
              onAssignClick={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {showCreateModal && (
        <CreateTaskModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          canDelete={user.role === "ADMIN" || editingTask.creator?._id === user.id}
        />
      )}

      {assigningTask && (
        <AssignTaskModal
          task={assigningTask}
          onClose={() => setAssigningTask(null)}
          onAssign={handleAdminAssign}
        />
      )}
    </div>
  );
}
