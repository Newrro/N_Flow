'use client';

import React, { useState } from 'react';
import { updateAttendance, createManualAttendance } from '@/app/admin/actions/workforce';
import { Check, X, AlertTriangle, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AttendanceTableProps {
  profiles: any[];
  attendance: any[];
  leaves: any[];
  dateStr: string;
}

export const AttendanceTable = ({ profiles, attendance, leaves, dateStr }: AttendanceTableProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const getStatus = (userId: string) => {
    const record = attendance.find(a => a.user_id === userId);
    if (record) return record;

    const leave = leaves.find(l => l.user_id === userId);
    if (leave) return { status: 'leave', isLeave: true };

    return null;
  };

  const handleUpdate = async (userId: string, status: any) => {
    setLoading(userId);
    const result = await createManualAttendance(userId, dateStr, status);
    if (result.error) {
      alert(result.error);
    }
    setLoading(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--surface-border)] bg-[var(--surface-1)]">
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Personnel Identity</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Mission Status</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Identity Resolution</th>
            <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Strategic Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--surface-border)] bg-[var(--surface-1)]">
          {profiles.map((profile) => {
            const currentStatus = getStatus(profile.id);
            const status = currentStatus?.status || 'absent';
            const isManual = currentStatus?.verified_by_admin;

            return (
              <tr key={profile.id} className="group hover:bg-[var(--surface-2)] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-2)] font-black text-[var(--brand-primary)]">
                        {profile.name[0]}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[var(--foreground)]">{profile.name}</h5>
                      <p className="text-[10px] text-[var(--foreground-muted)]">{profile.employee_id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={cn(
                         "badge text-[9px] py-1 font-black tracking-tight uppercase px-2.5 rounded-md",
                         status === 'absent' ? 'bg-[rgba(239,68,68,0.1)] text-[var(--status-danger)] border border-[rgba(239,68,68,0.1)]' : 
                         status === 'leave' ? 'bg-[rgba(99,102,241,0.1)] text-[var(--brand-primary)] border border-[rgba(99,102,241,0.1)]' : 
                         'bg-[var(--surface-3)] text-[var(--foreground-muted)] border border-[var(--surface-border)]'
                       )}>
                         {status}
                       </span>
                       {isManual && (
                         <div className="group relative">
                            <Info className="h-3 w-3 text-[var(--brand-primary)]" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-[8px] px-2 py-1 rounded whitespace-nowrap z-10">
                               Manually Verified
                            </div>
                         </div>
                       )}
                    </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-[10px] font-medium text-[var(--foreground-muted)] italic">
                    {status === 'absent' && "Deployment Void: Identity Offline."}
                    {status === 'present' && (currentStatus?.remarks ? `WFH: ${currentStatus.remarks}` : "Operational presence confirmed.")}
                    {status === 'leave' && "Authorized Offline Protocol."}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleUpdate(profile.id, 'present')}
                      disabled={loading === profile.id}
                      className={cn(
                        "rounded-lg p-1.5 transition-all",
                        status === 'present' 
                          ? "bg-[var(--status-success-dim)] text-[var(--status-success)] cursor-default" 
                          : "text-[var(--foreground-subtle)] hover:bg-[var(--surface-3)]"
                      )}
                      title="Override to Present"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleUpdate(profile.id, 'absent')}
                      disabled={loading === profile.id}
                      className={cn(
                        "rounded-lg p-1.5 transition-all text-[var(--foreground-subtle)] hover:bg-[var(--status-danger-dim)] hover:text-[var(--status-danger)]",
                        status === 'absent' && "bg-[var(--status-danger-dim)] text-[var(--status-danger)]"
                      )}
                      title="Mark as Absent"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                   
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
