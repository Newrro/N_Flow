'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, X, Loader2, Plus, Trash2, Shield, LayoutGrid } from 'lucide-react';
import { createProject, getEmployees } from '@/app/admin/actions/tasks';
import { cn } from '@/lib/utils';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  
  // Tasks list state
  const [templateTasks, setTemplateTasks] = useState<{ title: string; description: string }[]>([]);
  const [taskForm, setTaskForm] = useState({ title: '', description: '' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      getEmployees().then(setEmployees).catch(console.error);
      // Reset state
      setSelectedEmployees([]);
      setTemplateTasks([]);
      setTaskForm({ title: '', description: '' });
      setFormData({ name: '', description: '' });
    }
  }, [isOpen]);

  const handleToggleEmployee = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddTaskTemplate = () => {
    if (!taskForm.title.trim()) {
      alert('Task Title is required.');
      return;
    }
    setTemplateTasks((prev) => [...prev, { ...taskForm }]);
    setTaskForm({ title: '', description: '' });
  };

  const handleRemoveTaskTemplate = (index: number) => {
    setTemplateTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createProject({
        ...formData,
        allowed_employees: selectedEmployees,
        tasks: templateTasks,
      });

      if (res.error) {
        alert(`Failed to register project: ${res.error}`);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      alert('An unexpected error occurred while registering project.');
    } finally {
      setLoading(false);
    }
  };

  const labelClass = 'block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)] mb-1.5';
  const fieldClass = 'dark-input w-full py-2 px-3.5 text-xs';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-1)] shadow-[0_32px_80px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface-2)] px-6 py-4 shrink-0">
              <h2 className="flex items-center gap-2.5 font-bold text-[var(--foreground)] text-sm">
                <FolderPlus className="h-5 w-5 text-[var(--brand-primary)] animate-pulse" />
                Establish Strategic Project
              </h2>
              <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--foreground-subtle)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Project Details */}
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Project Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Project Aegis Security Gate"
                    className={fieldClass}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClass}>Project Objective / Description</label>
                  <textarea
                    required
                    placeholder="Define the primary operational goals and deliverables..."
                    className={fieldClass + ' min-h-[70px] resize-none'}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Allowed Employees Access */}
              <div className="border-t border-[var(--surface-border)]/50 pt-5 space-y-3">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Personnel Access Authorization
                </h4>
                <p className="text-[11px] text-[var(--foreground-muted)]">
                  Select which employees have authorization to view and execute tasks under this project.
                </p>

                {employees.length === 0 ? (
                  <p className="text-xs text-[var(--foreground-subtle)] italic">No personnel profiles registered on the network.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-[120px] overflow-y-auto p-2 border border-[var(--surface-border)] rounded-lg bg-[var(--surface-2)]">
                    {employees.map((emp) => {
                      const isChecked = selectedEmployees.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className={cn(
                            "flex items-center gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-all duration-200",
                            isChecked
                              ? "bg-[var(--brand-primary-dim)]/25 border-[var(--brand-primary-dim)] text-[var(--foreground)]"
                              : "border-[var(--surface-border)] hover:bg-[var(--surface-3)] text-[var(--foreground-subtle)]"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-[var(--surface-border)] bg-[var(--surface-1)] text-[var(--brand-primary)] accent-[var(--brand-primary)]"
                            checked={isChecked}
                            onChange={() => handleToggleEmployee(emp.id)}
                          />
                          <div className="truncate">
                            <p className="font-bold truncate">{emp.name}</p>
                            <p className="text-[9px] text-[var(--foreground-muted)]">{emp.employee_id}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic Task Planner */}
              <div className="border-t border-[var(--surface-border)]/50 pt-5 space-y-4">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                  <LayoutGrid className="h-4 w-4 text-indigo-500" />
                  Initiative Template Task Planner
                </h4>
                <p className="text-[11px] text-[var(--foreground-muted)]">
                  Add template tasks that will belong to this project. These tasks are saved as unassigned draft items for assignment later.
                </p>

                {/* Draft list */}
                {templateTasks.length > 0 && (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto p-1.5 bg-[var(--surface-2)] border border-[var(--surface-border)] rounded-lg">
                    {templateTasks.map((t, idx) => (
                      <div key={idx} className="flex items-start justify-between p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-1)] gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--foreground)] truncate">{t.title}</p>
                          {t.description && (
                            <p className="text-[10px] text-[var(--foreground-muted)] line-clamp-1 mt-0.5">{t.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTaskTemplate(idx)}
                          className="text-red-500/60 hover:text-red-500 p-1 hover:bg-red-500/10 rounded-md transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Task Form Fields */}
                <div className="p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-2)] space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Task Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Design Security Blueprint"
                        className={fieldClass}
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Task Objective (Optional)</label>
                      <input
                        type="text"
                        placeholder="Brief summary of requirements..."
                        className={fieldClass}
                        value={taskForm.description}
                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTaskTemplate}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--brand-primary)] bg-[var(--brand-primary-dim)]/20 hover:bg-[var(--brand-primary-dim)]/40 px-3 py-1.5 rounded-md border border-[var(--brand-primary-dim)] transition-all uppercase tracking-wider"
                  >
                    <Plus className="h-3.5 w-3.5" /> Append Task Template
                  </button>
                </div>
              </div>

              {/* Deploy button */}
              <div className="pt-2 shrink-0">
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FolderPlus className="h-4 w-4" /> Establish Project Category & Draft Tasks</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
