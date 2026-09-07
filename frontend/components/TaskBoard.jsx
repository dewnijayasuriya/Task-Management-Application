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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
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

  const assigneeOptions = useMemo(() => {
    const assignees = new Map();
    for (const task of tasks) {
      if (task.assignedUser?._id && task.assignedUser.name) {
        assignees.set(task.assignedUser._id, task.assignedUser.name);
      }
    }
    return Array.from(assignees, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !normalizedSearch ||
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.description?.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "ALL" ||
        (task.priority || "MEDIUM") === priorityFilter;
      const matchesAssignee =
        assigneeFilter === "ALL" ||
        (assigneeFilter === "UNASSIGNED" && !task.assignedUser) ||
        (assigneeFilter === "MINE" &&
          String(task.assignedUser?._id) === String(user.id)) ||
        String(task.assignedUser?._id) === assigneeFilter;

      return (
        matchesSearch && matchesStatus && matchesPriority && matchesAssignee
      );
    });
  }, [
    tasks,
    searchTerm,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    user.id,
  ]);

  const tasksByStatus = useMemo(() => {
    const grouped = { TODO: [], DOING: [], DONE: [] };
    for (const task of filteredTasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    }
    return grouped;
  }, [filteredTasks]);

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
      prev.map((t) => (t._id === activeId ? { ...t, status: destStatus } : t)),
    );

    try {
      const updatedTask = await updateTaskStatusApi(activeId, destStatus);
      setTasks((prev) =>
        prev.map((t) => (t._id === activeId ? updatedTask : t)),
      );
    } catch (err) {
      // Revert on failure and surface the error
      setTasks(previousTasks);
      setError(
        err.message || "Failed to update task status. Please try again.",
      );
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

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(140px,1fr))] gap-3 mb-6">
        <label className="sr-only" htmlFor="task-search">
          Search tasks
        </label>
        <input
          id="task-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search tasks by title or description"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <label className="sr-only" htmlFor="task-status-filter">
          Filter tasks by status
        </label>
        <select
          id="task-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="ALL">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="DOING">Doing</option>
          <option value="DONE">Done</option>
        </select>

        <label className="sr-only" htmlFor="task-priority-filter">
          Filter tasks by priority
        </label>
        <select
          id="task-priority-filter"
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="ALL">All priorities</option>
          <option value="LOW">Low priority</option>
          <option value="MEDIUM">Medium priority</option>
          <option value="HIGH">High priority</option>
        </select>

        <label className="sr-only" htmlFor="task-assignee-filter">
          Filter tasks by assignee
        </label>
        <select
          id="task-assignee-filter"
          value={assigneeFilter}
          onChange={(event) => setAssigneeFilter(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="ALL">All assignees</option>
          <option value="MINE">Assigned to me</option>
          <option value="UNASSIGNED">Unassigned</option>
          {assigneeOptions.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.name}
            </option>
          ))}
        </select>
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
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          canDelete={
            user.role === "ADMIN" || editingTask.creator?._id === user.id
          }
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
