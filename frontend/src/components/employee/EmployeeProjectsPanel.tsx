"use client";

import React, { useState, useMemo } from "react";
import {
  Users, CheckSquare, Folder, ChevronDown, ChevronUp, Clock, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmployeeProjectsPanelProps {
  projects: any[];
  tasks: any[];
  employees: any[];
  currentUserId: string;
}

export function EmployeeProjectsPanel({
  projects,
  tasks,
  employees,
  currentUserId
}: EmployeeProjectsPanelProps) {
  // Expanded project panel state
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Filter projects by employee authorization list
  // Employees can view all projects on the dashboard, even if not assigned to them (from user request 5)
  const filteredProjects = projects;

  // Group tasks by project to calculate metrics
  const projectMetrics = useMemo(() => {
    const metrics: Record<string, { total: number; completed: number; progress: number; tasks: any[] }> = {};
    
    filteredProjects.forEach((p) => {
      metrics[p.id] = { total: 0, completed: 0, progress: 0, tasks: [] };
    });

    tasks.forEach((t) => {
      const pid = t.project_id;
      if (pid && metrics[pid]) {
        metrics[pid].tasks.push(t);
        metrics[pid].total += 1;
        // Progress must be updated only if verified by admin (is_verified is true)
        if (t.status === "completed" && t.is_verified) {
          metrics[pid].completed += 1;
        }
      }
    });

    // Calculate progress
    Object.keys(metrics).forEach((pid) => {
      const { total, completed } = metrics[pid];
      metrics[pid].progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    });

    return metrics;
  }, [filteredProjects, tasks]);

  const toggleExpandProject = (id: string) => {
    setExpandedProjectId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="dark-card flex flex-col overflow-hidden bg-gradient-to-b from-[var(--surface-1)] to-[var(--surface-2)]">
      <div className="flex items-center justify-between border-b border-[var(--surface-border)] px-8 py-7 bg-[var(--surface-2)]/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-primary-dim)] border border-[rgba(99,102,241,0.2)] text-[var(--brand-primary)]">
            <Folder className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-[var(--foreground)]">Strategic Projects & Initiatives</h2>
            <p className="text-xs text-[var(--foreground-muted)]">Audit corporate deliverables, check access lists, and track your tasks.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-3)] px-3 py-1.5 shadow-sm">
          <span className="pulse-dot green" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Live Progress</span>
        </div>
      </div>

      <div className="p-8 space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[var(--surface-border)] py-16 text-center bg-[var(--surface-1)]">
            <Folder className="mx-auto h-12 w-12 text-[var(--foreground-subtle)] opacity-10 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-[var(--foreground-subtle)]">No corporate projects available.</p>
          </div>
        ) : (
          filteredProjects.map((proj) => {
            const metrics = projectMetrics[proj.id] || { total: 0, completed: 0, progress: 0, tasks: [] };
            const isExpanded = expandedProjectId === proj.id;
            
            const allowedIds: string[] = Array.isArray(proj.allowed_employees) ? proj.allowed_employees : [];
            const allowedEmployees = employees.filter((emp) => allowedIds.includes(emp.id));

            return (
              <div 
                key={proj.id}
                className={cn(
                  "border rounded-xl overflow-hidden transition-all duration-300 bg-[var(--surface-3)]/10",
                  isExpanded 
                    ? "border-[var(--brand-primary)] shadow-[0_12px_36px_rgba(99,102,241,0.08)] bg-[var(--surface-3)]/30" 
                    : "border-[var(--surface-border)] hover:border-[var(--surface-border-hover)]"
                )}
              >
                <div 
                  onClick={() => toggleExpandProject(proj.id)}
                  className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between cursor-pointer select-none"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[var(--foreground)] truncate flex items-center gap-2">
                      <Folder className="h-4.5 w-4.5 text-[var(--brand-primary)]" />
                      {proj.name}
                    </h4>
                    <p className="text-[11px] text-[var(--foreground-muted)] truncate mt-1">
                      {proj.description || "No project overview declared."}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-1 max-w-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-subtle)] shrink-0 min-w-[70px]">
                      Progress: {metrics.progress}%
                    </div>
                    <div className="flex-1 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                        style={{ width: `${metrics.progress}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-[var(--foreground-subtle)] shrink-0 font-bold">
                      {metrics.completed}/{metrics.total} Verified Tasks
                    </div>
                  </div>

                  <div className="shrink-0 text-[var(--foreground-subtle)]">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="border-t border-[var(--surface-border)]/50 bg-[var(--surface-2)]/20"
                    >
                      <div className="p-5 space-y-5">
                        {/* Authorized Personnel */}
                        <div className="space-y-3">
                          <h5 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--foreground-subtle)]">
                            <Users className="h-4 w-4 text-emerald-500" />
                            Authorized Personnel Access List ({allowedEmployees.length})
                          </h5>
                          
                          {allowedEmployees.length === 0 ? (
                            <p className="text-xs text-[var(--foreground-muted)] italic pl-1">No personnel have been granted access to this category.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2.5 items-center">
                              {allowedEmployees.map((emp) => {
                                const isMe = emp.id === currentUserId;
                                return (
                                  <div 
                                    key={emp.id}
                                    className={cn(
                                      "flex items-center gap-2 p-1.5 pr-2.5 rounded-lg border text-[11px] font-bold transition-all",
                                      isMe
                                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                                        : "border-[var(--surface-border)] bg-[var(--surface-1)] text-[var(--foreground)]"
                                    )}
                                  >
                                    <div className={cn(
                                      "flex h-4.5 w-4.5 items-center justify-center rounded text-[9px] font-bold uppercase",
                                      isMe ? "bg-emerald-500/20 text-emerald-400" : "bg-[var(--brand-primary-dim)] text-[var(--brand-accent)]"
                                    )}>
                                      {emp.name.charAt(0)}
                                    </div>
                                    <p className="leading-none flex items-center gap-1">
                                      {emp.name}
                                      {isMe && <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-emerald-500/20 leading-none">You</span>}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Initiatives Tasks */}
                        <div className="space-y-3">
                          <h5 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--foreground-subtle)]">
                            <CheckSquare className="h-4 w-4 text-indigo-500" />
                            Initiative Tasks Ledger ({metrics.tasks.length})
                          </h5>

                          {metrics.tasks.length === 0 ? (
                            <p className="text-xs text-[var(--foreground-muted)] italic pl-1">No initiatives precreated or active under this project.</p>
                          ) : (
                            <div className="overflow-hidden border border-[var(--surface-border)] rounded-lg bg-[var(--surface-1)]">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                  <thead>
                                    <tr className="bg-[var(--surface-2)] text-[10px] font-black uppercase tracking-widest text-[var(--foreground-subtle)] border-b border-[var(--surface-border)]">
                                      <th className="p-3">Deliverable Initiative</th>
                                      <th className="p-3">Assignee</th>
                                      <th className="p-3">Difficulty</th>
                                      <th className="p-3">Target Date</th>
                                      <th className="p-3 text-right">Status / Verification</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[var(--surface-border)]/50 text-xs font-semibold text-[var(--foreground)]">
                                    {metrics.tasks.map((task) => {
                                      const isMyTask = task.assigned_to === currentUserId;
                                      return (
                                        <tr 
                                          key={task.id} 
                                          className={cn(
                                            "transition-colors hover:bg-[var(--surface-2)]/30",
                                            isMyTask && "bg-[var(--brand-primary-dim)]/5"
                                          )}
                                        >
                                          <td className="p-3 max-w-[180px] truncate">
                                            <p className="font-bold flex items-center gap-1.5">
                                              {task.title}
                                              {isMyTask && <span className="text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Your Directive</span>}
                                            </p>
                                            {task.description && <p className="text-[10px] text-[var(--foreground-muted)] truncate mt-0.5">{task.description}</p>}
                                          </td>
                                          <td className="p-3">
                                            {task.profiles ? (
                                              <span className="flex items-center gap-1.5">
                                                <span className={cn("h-1.5 w-1.5 rounded-full", isMyTask ? "bg-emerald-400" : "bg-indigo-400")}></span>
                                                {task.profiles.name} {isMyTask && "(You)"}
                                              </span>
                                            ) : (
                                              <span className="text-[var(--foreground-subtle)] flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-gray-500"></span>
                                                Unassigned Draft
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-3 uppercase text-[9px] font-black tracking-wider">
                                            <span className={cn(
                                              "px-1.5 py-0.5 rounded border",
                                              task.priority === "urgent" && "text-red-400 border-red-500/20 bg-red-500/5",
                                              task.priority === "high" && "text-amber-400 border-amber-500/20 bg-amber-500/5",
                                              task.priority === "medium" && "text-violet-400 border-violet-500/20 bg-violet-500/5",
                                              task.priority === "low" && "text-cyan-400 border-cyan-500/20 bg-cyan-500/5"
                                            )}>
                                              {task.priority || "medium"}
                                            </span>
                                          </td>
                                          <td className="p-3 text-[10px]">
                                            {task.deadline ? new Date(task.deadline).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                          </td>
                                          <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-2.5">
                                              {task.status === "completed" ? (
                                                task.is_verified ? (
                                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                                    <CheckCircle2 className="h-3 w-3" /> VERIFIED
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                                    <Clock className="h-3 w-3 animate-pulse" /> AWAITING VERIFICATION
                                                  </span>
                                                )
                                              ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                                  <Clock className="h-3 w-3" /> ACTIVE
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}