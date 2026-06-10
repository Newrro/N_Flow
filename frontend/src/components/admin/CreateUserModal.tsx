'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Mail, Shield, Loader2, Key, Info } from 'lucide-react';
import { createUser } from '@/app/admin/actions/users';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employee_id: '',
    role: 'employee' as 'admin' | 'employee',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUser(formData);
      onSuccess();
      onClose();
      setFormData({ name: '', email: '', employee_id: '', role: 'employee', password: '' });
    } catch (error: any) {
      alert(error.message || 'Failed to provision user.');
    } finally {
      setLoading(false);
    }
  };

  const labelClass = 'block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)] mb-1.5';
  const fieldClass = 'dark-input w-full py-2.5 px-4 text-sm';

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
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-1)] shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface-2)] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-primary-dim)] text-[var(--brand-primary)]" style={{ border: '1px solid rgba(99,102,241,0.25)' }}>
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-bold text-[var(--foreground)]">Provision Personnel</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">Identity Management</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--foreground-subtle)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Alexander Pierce"
                    className={fieldClass}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Employee ID</label>
                  <input
                    required
                    type="text"
                    placeholder="EMP-2024-001"
                    className={fieldClass}
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                  <input
                    required
                    type="email"
                    placeholder="a.pierce@company.com"
                    className={fieldClass + ' pl-10'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>System Role</label>
                  <div className="relative">
                    <Shield className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                    <select
                      className={fieldClass + ' pl-10 appearance-none'}
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'employee' })}
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Initial Password</label>
                  <div className="relative">
                    <Key className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      className={fieldClass + ' pl-10'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="flex gap-3 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-2)] p-4 text-[var(--foreground-muted)]">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-[var(--brand-primary)]" />
                <p className="text-xs leading-relaxed">
                  The user can log in immediately with this password and should update their credentials on first sign-in.
                </p>
              </div>

              <div className="pt-1">
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Commit to Registry</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}