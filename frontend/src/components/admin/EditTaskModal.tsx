'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Loader2, Edit, User } from 'lucide-react';
import { getEmployees, getProjects, TaskPriority } from '@/app/admin/actions/tasks';
import { updateTask } from '@/app/admin/actions/tasks'; // We'll add this server action
import { cn } from '@/lib/utils';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: any; // Task to edit
}

export function EditTaskModal({ isOpen, onClose, onSuccess, task }: EditTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium' as TaskPriority,
    assigned_to: '',
    project_id: '',
  });

  const fetchInitialData = async () => {
    try {
      const [empData, projData] = await Promise.all([
        getEmployees(),
        getProjects(),
      ]);
      setEmployees(empData);
      setProjects(projData);
    } catch (err) {
      console.error('Error fetching task config console:', err);
    }
  };

  useEffect(() => {
    if (isOpen && task) {
      fetchInitialData();
      
      // Format deadline date to YYYY-MM-DD for date input
      let deadlineStr = '';
      if (task.deadline) {
        deadlineStr = new Date(task.deadline).toISOString().split('T')[0];
      }

      setFormData({
        title: task.title || '',
        description: task.description || '',
        deadline: deadlineStr,
        priority: (task.priority || 'medium') as TaskPriority,
        assigned_to: task.assigned_to || '',
        project_id: task.project_id || '',
      });
    }
  }, [isOpen, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    setLoading(true);
    try {
      const res = await updateTask(task.id, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        deadline: formData.deadline,
        assigned_to: formData.assigned_to || null,
        project_id: formData.project_id || null,
      });

      if (res?.error) {
        alert(`Update failed: ${res.error}`);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      alert(`Failed to update task: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const labelClass = 'block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)] mb-1.5';
  const fieldClass = 'dark-input w-full py-2 px-3.5 text-xs';

  return (
    <AnimatePresence>
      {isOpen && task && (
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
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-1)] shadow-[0_32px_80px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface-2)] px-6 py-4 shrink-0">
              <h2 className="flex items-center gap-2.5 font-bold text-[var(--foreground)] text-sm">
                <Edit className="h-5 w-5 text-[var(--brand-primary)]" />
                Modify Initiative
              </h2>
              <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--foreground-subtle)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Project Category */}
              <div>
                <label className={labelClass}>Project Category</label>
                <select
                  className={fieldClass + ' appearance-none'}
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                >
                  <option value="">Individual Initiative (No Project)</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div>
                <label className={labelClass}>Task Title</label>
                <input
                  required
                  type="text"
                  className={fieldClass}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Operational Objective</label>
                <textarea
                  required
                  className={fieldClass + ' min-h-[80px] resize-none'}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Deadline & Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Target Deadline</label>
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
                  <label className={labelClass}>Difficulty Level</label>
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

              {/* Assignee */}
              <div>
                <label className={labelClass}>Assignee</label>
                <select
                  className={fieldClass + ' appearance-none'}
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                >
                  <option value="">Unassigned Draft</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_id || 'No ID'}) {emp.role === 'admin' ? '[Admin]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit button */}
              <div className="pt-4 shrink-0">
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Save Changes</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
