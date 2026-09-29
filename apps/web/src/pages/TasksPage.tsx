import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Circle,
  CheckCircle2,
  Clock,
  Filter,
  Calendar,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Task, TaskType, TaskStatus, TaskPriority } from '@linkedin-growth/shared';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { formatDate } from '../lib/utils.js';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [dueTodayOnly, setDueTodayOnly] = useState(false);

  // Modal & form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: TaskType.GENERAL,
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    dueAt: '',
  });

  const loadTasks = () => {
    setLoading(true);
    api.getTasks({
      status: selectedStatus,
      type: selectedType,
      priority: selectedPriority,
      dueToday: dueTodayOnly ? 'true' : undefined,
    })
      .then(setTasks)
      .catch((err) => console.error('Failed to load tasks:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, [selectedStatus, selectedType, selectedPriority, dueTodayOnly]);

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      await api.updateTask(task.id, { status: nextStatus });
    } catch (err: any) {
      console.error('Error toggling task:', err);
      loadTasks();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      alert(`Failed to delete task: ${err.message}`);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTask({
        title: form.title,
        description: form.description || null,
        type: form.type,
        priority: form.priority,
        status: form.status,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      });

      setIsAddModalOpen(false);
      setForm({
        title: '',
        description: '',
        type: TaskType.GENERAL,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueAt: '',
      });
      loadTasks();
    } catch (err: any) {
      alert(`Error creating task: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            Unified Action Tasks
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized queue for networking follow-ups, post reviews, lead audits, and applications.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Due Today Quick Filter */}
        <button
          onClick={() => setDueTodayOnly(!dueTodayOnly)}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium border transition-colors ${
            dueTodayOnly
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Due Today</span>
        </button>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          {Object.values(TaskStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="ALL">All Types</option>
          {Object.values(TaskType).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="ALL">All Priorities</option>
          {Object.values(TaskPriority).map((p) => (
            <option key={p} value={p}>
              {p} Priority
            </option>
          ))}
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          <CheckSquare className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-3 text-sm font-semibold text-slate-200">No tasks in this view</h3>
          <p className="mt-1 text-xs text-slate-500">
            Create a task or clear filters to see your queue.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const isDone = task.status === TaskStatus.DONE;
            return (
              <div
                key={task.id}
                className={`group flex items-start justify-between gap-4 rounded-xl border p-4 backdrop-blur-md transition-all ${
                  isDone
                    ? 'border-slate-800/40 bg-slate-900/20 opacity-60'
                    : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <button
                    onClick={() => handleToggleTask(task)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div>
                    <h3
                      className={`text-sm font-medium ${
                        isDone ? 'line-through text-slate-400' : 'text-slate-100'
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="mt-1 text-xs text-slate-400">{task.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="status" status={task.type}>
                        {task.type}
                      </Badge>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
                        {task.priority}
                      </span>
                      {task.dueAt && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(task.dueAt)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Action Task"
        description="Add a task to your unified personal growth dashboard."
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. Follow up with Elena regarding Raft consensus article"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              placeholder="Additional details or next steps..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Category / Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as TaskType })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {Object.values(TaskType).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {Object.values(TaskPriority).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg border border-slate-800 px-4 py-2 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
            >
              Create Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
