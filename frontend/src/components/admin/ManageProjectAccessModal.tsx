'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Loader2 } from 'lucide-react';
import { getEmployees, updateProjectAllowedEmployees } from '@/app/admin/actions/tasks';
import { cn } from '@/lib/utils';

interface ManageProjectAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: any; // The project being managed
}

export function ManageProjectAccessModal({
  isOpen,
  onClose,
  onSuccess,
  project
}: ManageProjectAccessModalProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const fetchEmployeesList = async () => {
    try {
      const empData = await getEmployees();
      setEmployees(empData);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      fetchEmployeesList();
      
      const allowed = Array.isArray(project.allowed_employees) 
        ? project.allowed_employees 
        : [];
      setSelectedEmployees(allowed);
    }
  }, [isOpen, project]);

  const handleToggleEmployee = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setLoading(true);
    try {
      const res = await updateProjectAllowedEmployees(project.id, selectedEmployees);

      if (res?.error) {
        alert(`Update failed: ${res.error}`);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      alert(`Failed to save access changes: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const labelClass = 'block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)] mb-2';

  return (
    <AnimatePresence>
      {isOpen && project && (
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
            className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-1)] shadow-[0_32px_80px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface-2)] px-6 py-4 shrink-0">
              <h2 className="flex items-center gap-2.5 font-bold text-[var(--foreground)] text-sm">
                <Users className="h-5 w-5 text-emerald-400" />
                Manage Personnel Access
              </h2>
              <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--foreground-subtle)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <p className="text-xs text-[var(--foreground-muted)] mb-1 leading-relaxed">
                  Modify the list of personnel authorized to access the project:
                </p>
                <p className="text-sm font-extrabold text-[var(--brand-accent)] mb-4">
                  📁 {project.name}
                </p>
                
                <label className={labelClass}>Authorized Personnel</label>
                
                {employees.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[var(--foreground-muted)] italic">
                    Loading personnel records...
                  </div>
                ) : (
                  <div className="grid gap-2 border border-[var(--surface-border)] bg-[var(--surface-2)] p-3 rounded-lg max-h-[250px] overflow-y-auto">
                    {employees.map((emp) => {
                      const isChecked = selectedEmployees.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all",
                            isChecked
                              ? "bg-emerald-500/5 border-emerald-500/20 text-[var(--foreground)]"
                              : "border-[var(--surface-border)] hover:bg-[var(--surface-3)] text-[var(--foreground-subtle)]"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-[var(--surface-border)] text-emerald-500 accent-emerald-500"
                            checked={isChecked}
                            onChange={() => handleToggleEmployee(emp.id)}
                          />
                          <div className="truncate min-w-0 flex-1">
                            <p className="font-bold truncate">{emp.name}</p>
                            <p className="text-[9px] text-[var(--foreground-muted)]">ID: {emp.employee_id}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit button */}
              <div className="pt-2 shrink-0">
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 bg-emerald-600 hover:bg-emerald-500 border-emerald-500/20 text-white disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Save Access List</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
