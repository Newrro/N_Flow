"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import NotificationCenter from './NotificationCenter';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    name: string;
    role: 'admin' | 'employee';
    email: string;
  };
}

const DashboardLayout = ({ children, user }: DashboardLayoutProps) => {
  const [showModal, setShowModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowModal(false);
          setSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-[var(--background)]"
      style={{ 
        height: '100dvh',  // dynamic viewport height — handles mobile browser chrome
        overflow: 'hidden'
      }}
    >
      <Sidebar role={user.role} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface-1)] px-4 md:px-6"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="topbar-title">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">
              Workspace
            </p>
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              {user.role === 'admin' ? 'Admin Central' : 'Employee Portal'}
            </h2>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <NotificationCenter />
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left focus:outline-none"
              title="Change Account Password"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-[var(--foreground)]">{user.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-primary)]">
                  {user.role}
                </p>
              </div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(99,102,241,0.25)] bg-[var(--brand-primary-dim)] text-sm font-bold text-[var(--brand-accent)]"
                style={{ boxShadow: '0 0 16px rgba(99,102,241,0.15)' }}
              >
                {user.name.charAt(0)}
              </div>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main 
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 mobile-content-area"
          style={{ paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : undefined }}
        >
          <div className="mx-auto w-full max-w-[100rem]">
            {children}
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
          <div className="modal-container relative w-full md:max-w-md rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-1)] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--foreground)] mb-2">Change Account Password</h3>
            <p className="text-xs text-[var(--foreground-muted)] mb-5">
              Enter your new password below. Ensure it is at least 6 characters.
            </p>

            {success ? (
              <div className="rounded-xl border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.08)] p-4 text-[var(--status-success)] text-xs font-bold text-center">
                Password updated successfully!
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                {error && (
                  <p className="text-xs font-semibold text-[var(--status-danger)]">{error}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setError(null); }}
                    className="rounded-lg px-4 py-2 text-xs font-bold text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Save Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
