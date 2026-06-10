'use client';

import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Loader2, Clock } from 'lucide-react';
import { recordLogin, recordLogout } from '@/app/employee/actions/attendance';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AttendanceActionsProps {
  initialAttendance: any;
}

export const AttendanceActions = ({ initialAttendance }: AttendanceActionsProps) => {
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [remarks, setRemarks] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    const result = await recordLogin(remarks);
    if (result.success) {
      toast.success('Shift started. Deployment verified.');
      // Refresh local state or just let revalidatePath handle it
      window.location.reload(); 
    } else {
      toast.error(result.error || 'Failed to start shift.');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    const result = await recordLogout();
    if (result.success) {
      toast.success('Shift ended. Operational logs finalized.');
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to end shift.');
    }
    setLoading(false);
  };

  const isLoggedIn = attendance?.login_time && !attendance?.logout_time;
  const isLoggedOut = !!attendance?.logout_time;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {!isLoggedIn && !isLoggedOut && (
          <div className="flex-1 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Add login remarks (e.g., Working from Home / WFH)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-4 py-3 text-xs bg-[var(--surface-2)] border border-[var(--surface-border)] rounded-xl text-[var(--foreground)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--status-success)] px-6 py-4 text-xs font-black text-white uppercase tracking-widest shadow-lg shadow-[var(--status-success-dim)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Initiate Shift
            </button>
          </div>
        )}

        {isLoggedIn && (
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--status-danger)] px-6 py-4 text-xs font-black text-white uppercase tracking-widest shadow-lg shadow-[var(--status-danger-dim)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Terminate Shift
          </button>
        )}

        {isLoggedOut && (
          <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--surface-3)] border border-[var(--surface-border)] px-6 py-4 text-xs font-black text-[var(--foreground-muted)] uppercase tracking-widest cursor-not-allowed">
            <Clock className="h-4 w-4" />
            Shift Completed
          </div>
        )}
      </div>

      {attendance?.login_time && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--surface-3)]/50 border border-[var(--surface-border)]">
              <p className="text-[8px] font-black uppercase tracking-tighter text-[var(--foreground-muted)] mb-1">Login Time</p>
              <p className="text-xs font-bold text-[var(--foreground)]">
                {mounted ? new Date(attendance.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface-3)]/50 border border-[var(--surface-border)]">
              <p className="text-[8px] font-black uppercase tracking-tighter text-[var(--foreground-muted)] mb-1">Logout Time</p>
              <p className="text-xs font-bold text-[var(--foreground)]">
                {attendance.logout_time ? (mounted ? new Date(attendance.logout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--') : 'Pending...'}
              </p>
            </div>
          </div>

          {attendance.remarks && (
            <div className="p-4 rounded-xl bg-[var(--surface-3)]/30 border border-[var(--surface-border)]">
              <p className="text-[8px] font-black uppercase tracking-tighter text-[var(--foreground-muted)] mb-1">Shift Remarks (WFH)</p>
              <p className="text-xs font-semibold text-[var(--foreground-muted)] italic">
                "{attendance.remarks}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
