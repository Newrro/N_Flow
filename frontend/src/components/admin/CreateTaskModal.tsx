'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar, Loader2, CheckSquare, ListTodo, User } from 'lucide-react';
import { createTask, getEmployees, getProjects, getTasks, TaskPriority } from '@/app/admin/actions/tasks';
import { cn } from '@/lib/utils';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTaskModal({ isOpen, onClose, onSuccess }: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  
  // Custom Flow States
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTemplateTaskId, setSelectedTemplateTaskId] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium' as TaskPriority,
  });

  const fetchInitialData = async () => {
    try {
      const [empData, projData, taskData] = await Promise.all([
        getEmployees(),
        getProjects(),
        getTasks()
      ]);
      setEmployees(empData);
      setProjects(projData);
      setAllTasks(taskData);
    } catch (err) {
      console.error('Error fetching task config console:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      // Reset flow
      setSelectedProjectId('');
      setSelectedTemplateTaskId('');
      setSelectedEmployees([]);
      setFormData({
        title: '',
        description: '',
        deadline: '',
        priority: 'medium',
      });
    }
  }, [isOpen]);

  // Filter unassigned task templates belonging to the selected project
  const projectTemplates = useMemo(() => {
    if (!selectedProjectId) return [];
    return allTasks.filter((t) => t.project_id === selectedProjectId && !t.assigned_to);
  }, [allTasks, selectedProjectId]);

  // Autofill form if template task is selected
  useEffect(() => {
    if (selectedTemplateTaskId && selectedTemplateTaskId !== 'new') {
      const selected = projectTemplates.find((t) => t.id === selectedTemplateTaskId);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          title: selected.title,
          description: selected.description || '',
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        title: '',
        description: '',
      }));
    }
  }, [selectedTemplateTaskId, projectTemplates]);

  const handleToggleEmployee = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) {
      alert('Please assign at least one employee to this initiative.');
      return;
    }

    setLoading(true);
    try {
      const res = await createTask({
        id: (selectedTemplateTaskId && selectedTemplateTaskId !== 'new') ? selectedTemplateTaskId : undefined,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        deadline: formData.deadline,
        assigned_to: selectedEmployees,
        project_id: selectedProjectId || undefined,
      });

      if (res?.error) {
        alert(`Assignment failed: ${res.error}`);
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      alert('Failed to deploy task assignments.');
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
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-1)] shadow-[0_32px_80px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface-2)] px-6 py-4 shrink-0">
              <h2 className="flex items-center gap-2.5 font-bold text-[var(--foreground)] text-sm">
                <CheckSquare className="h-5 w-5 text-[var(--brand-primary)]" />
                Assign initiative
              </h2>
              <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--foreground-subtle)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* STEP 1: Select Project */}
              <div>
                <label className={labelClass}>1. Select Project Category</label>
                <select
                  required
                  className={fieldClass + ' appearance-none'}
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setSelectedTemplateTaskId('');
                  }}
                >
                  <option value="">Select Strategic Project</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              {/* STEP 2: Select Task (Only if Project is Selected) */}
              {selectedProjectId && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>2. Choose Initiative Task</label>
                    <select
                      required
                      className={fieldClass + ' appearance-none'}
                      value={selectedTemplateTaskId}
                      onChange={(e) => setSelectedTemplateTaskId(e.target.value)}
                    >
                      <option value="">Select Project Task Template</option>
                      {projectTemplates.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                      <option value="new">+ Deploy Custom Task (Create New)</option>
                    </select>
                  </div>

                  {/* Task Form Inputs (Only shown if custom task selected or template chosen) */}
                  {selectedTemplateTaskId && (
                    <div className="p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-2)] space-y-4">
                      <div>
                        <label className={labelClass}>Task Title</label>
                        <input
                          required
                          disabled={selectedTemplateTaskId !== 'new'}
                          type="text"
                          className={fieldClass + ' disabled:opacity-75'}
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Operational Objective</label>
                        <textarea
                          required
                          disabled={selectedTemplateTaskId !== 'new'}
                          className={fieldClass + ' min-h-[60px] resize-none disabled:opacity-75'}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Assign Employee(s) & Difficulty */}
              {selectedTemplateTaskId && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>3. Target Deadline</label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                        <input
                          required
                          type="date"
                          className={fieldClass + ' pl-9'}
                          value={formData.deadline}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>4. Difficulty Level (Priority)</label>
                      <select
                        className={fieldClass + ' appearance-none'}
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                      >
                        <option value="low">Low (Easy)</option>
                        <option value="medium">Medium (Standard)</option>
                        <option value="high">High (Difficult)</option>
                        <option value="urgent">Urgent (Expert)</option>
                      </select>
                    </div>
                  </div>

                  {/* Multi-employee check list */}
                  <div className="space-y-2 pt-2">
                    <label className={labelClass}>5. Assign To Employee(s)</label>
                    <p className="text-[10px] text-[var(--foreground-muted)] mb-2">Select one or more employees. A distinct initiative will be created for each selection.</p>

                    {employees.length === 0 ? (
                      <p className="text-xs text-[var(--foreground-subtle)] italic">No personnel records found.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto border border-[var(--surface-border)] bg-[var(--surface-2)] p-2.5 rounded-lg">
                        {employees.map((emp) => {
                          const isChecked = selectedEmployees.includes(emp.id);
                          return (
                            <label
                              key={emp.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-all",
                                isChecked
                                  ? "bg-[var(--brand-primary-dim)]/20 border-[var(--brand-primary-dim)] text-[var(--foreground)]"
                                  : "border-[var(--surface-border)] hover:bg-[var(--surface-3)] text-[var(--foreground-subtle)]"
                              )}
                            >
                              <input
                                type="checkbox"
                                className="rounded border-[var(--surface-border)] text-[var(--brand-primary)] accent-[var(--brand-primary)]"
                                checked={isChecked}
                                onChange={() => handleToggleEmployee(emp.id)}
                              />
                              <div className="truncate min-w-0 flex-1">
                                <p className="font-bold truncate flex items-center justify-between">
                                  <span>{emp.name}</span>
                                  {emp.role === 'admin' && (
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--brand-accent)] bg-[var(--brand-primary-dim)]/50 px-1.5 py-0.5 rounded border border-[rgba(99,102,241,0.2)] shrink-0 scale-90">Admin</span>
                                  )}
                                </p>
                                <p className="text-[9px] text-[var(--foreground-muted)] mt-0.5">{emp.employee_id || 'No ID'}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit button */}
              {selectedTemplateTaskId && (
                <div className="pt-2 shrink-0">
                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Deploy Task Assignment(s)</>}
                  </button>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}