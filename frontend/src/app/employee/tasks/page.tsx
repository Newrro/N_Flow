"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { getMyTasks } from "@/app/employee/actions/logs";
import { Calendar, CheckCircle2, Clock, ListTodo, ChevronDown, ChevronUp, Folder, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function TasksContent() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const searchParams = useSearchParams();
  const expandParam = searchParams.get("expand");
  const taskParam = searchParams.get("task");

  useEffect(() => {
    getMyTasks().then((tData) => {
      setTasks(tData);
      
      // Auto expand based on the query parameter
      if (expandParam) {
        setExpandedProjects((prev) => ({
          ...prev,
          [expandParam]: true
        }));
      } else if (taskParam) {
        // If task parameter is passed, find its project and expand it
        const targetTask = tData.find((t) => t.id === taskParam);
        if (targetTask) {
          const pid = targetTask.project_id || "none";
          setExpandedProjects((prev) => ({
            ...prev,
            [pid]: true
          }));
        }
      }
    }).finally(() => setLoading(false));
  }, [expandParam, taskParam]);

  const toggleProjectExpand = (id: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const summary = useMemo(() => {
    const total = tasks.length;
    const completedVerified = tasks.filter((t) => t.status === "completed" && t.is_verified).length;
    const completedAwaiting = tasks.filter((t) => t.status === "completed" && !t.is_verified).length;
    const pending = tasks.filter((t) => t.status !== "completed").length;
    return { total, completedVerified, completedAwaiting, pending };
  }, [tasks]);

  // Group tasks by project
  const groupedTasks = useMemo(() => {
    const groups: Record<string, { name: string; description: string; tasks: any[] }> = {};
    
    tasks.forEach((t) => {
      const pid = t.project_id || "none";
      const pname = t.project?.name || "Individual Assignments";
      const pdesc = t.project?.description || "Independent initiatives and operational directives.";
      
      if (!groups[pid]) {
        groups[pid] = { name: pname, description: pdesc, tasks: [] };
      }
      groups[pid].tasks.push(t);
    });

    return groups;
  }, [tasks]);

  const labelClass = 'text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)]';

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="dark-card p-6 bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]">
          <p className={labelClass}>Total Directives</p>
          {loading ? (
            <div className="mt-1 h-8 w-12 animate-pulse rounded bg-[var(--surface-3)]" />
          ) : (
            <h3 className="mt-1 text-3xl font-black text-[var(--foreground)]">{summary.total}</h3>
          )}
        </div>
        <div className="dark-card p-6 bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]">
          <p className={labelClass}>Verified Completed</p>
          {loading ? (
            <div className="mt-1 h-8 w-12 animate-pulse rounded bg-[var(--surface-3)]" />
          ) : (
            <h3 className="mt-1 text-3xl font-black text-emerald-400">{summary.completedVerified}</h3>
          )}
        </div>
        <div className="dark-card p-6 bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]">
          <p className={labelClass}>Awaiting Verification</p>
          {loading ? (
            <div className="mt-1 h-8 w-12 animate-pulse rounded bg-[var(--surface-3)]" />
          ) : (
            <h3 className="mt-1 text-3xl font-black text-indigo-400">{summary.completedAwaiting}</h3>
          )}
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded-xl bg-[var(--surface-2)]" />
            <div className="h-20 animate-pulse rounded-xl bg-[var(--surface-2)]" />
          </div>
        ) : Object.keys(groupedTasks).length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[var(--surface-border)] py-16 text-center bg-[var(--surface-1)]">
            <ListTodo className="mx-auto h-12 w-12 text-[var(--foreground-subtle)] opacity-10 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-[var(--foreground-subtle)]">No active assignments recorded.</p>
          </div>
        ) : (
          Object.keys(groupedTasks).map((pid) => {
            const group = groupedTasks[pid];
            const isExpanded = !!expandedProjects[pid];
            
            // Calculate progress strictly from verified completed tasks
            const totalCount = group.tasks.length;
            const completedVerifiedCount = group.tasks.filter(t => t.status === "completed" && t.is_verified).length;
            const progress = totalCount > 0 ? Math.round((completedVerifiedCount / totalCount) * 100) : 0;

            return (
              <div 
                key={pid}
                className={cn(
                  "border rounded-xl overflow-hidden transition-all duration-300 bg-[var(--surface-2)]/30",
                  isExpanded 
                    ? "border-[var(--brand-primary)] shadow-[0_12px_36px_rgba(99,102,241,0.08)] bg-[var(--surface-3)]/20" 
                    : "border-[var(--surface-border)] hover:border-[var(--surface-border-hover)]"
                )}
              >
                {/* Project Header Card */}
                <div 
                  onClick={() => toggleProjectExpand(pid)}
                  className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between cursor-pointer select-none"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[var(--foreground)] truncate flex items-center gap-2">
                      <Folder className="h-4.5 w-4.5 text-[var(--brand-primary)]" />
                      {group.name}
                    </h4>
                    <p className="text-[11px] text-[var(--foreground-muted)] truncate mt-1">
                      {group.description || "No project overview declared."}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-1 max-w-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-subtle)] shrink-0 min-w-[70px]">
                      Your Progress: {progress}%
                    </div>
                    <div className="flex-1 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-[var(--foreground-subtle)] shrink-0 font-bold">
                      {completedVerifiedCount}/{totalCount} Verified
                    </div>
                  </div>

                  <div className="shrink-0 text-[var(--foreground-subtle)]">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {/* Expanded Tasks Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="border-t border-[var(--surface-border)]/50 bg-[var(--surface-2)]/10"
                    >
                      <div className="p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {group.tasks.map((task) => {
                            const isSelected = task.id === taskParam;
                            return (
                              <motion.div 
                                key={task.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                  "border rounded-xl p-5 bg-[var(--surface-1)] transition-all flex flex-col justify-between",
                                  isSelected 
                                    ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500" 
                                    : "border-[var(--surface-border)] hover:border-[var(--surface-border-hover)]"
                                )}
                              >
                                <div>
                                  {/* Task Title & Status Pill */}
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <h5 className="text-xs font-bold text-[var(--foreground)] flex-1 leading-snug">
                                      {task.title}
                                    </h5>
                                    <div className="shrink-0">
                                      {task.status === "completed" ? (
                                        task.is_verified ? (
                                          <span className="inline-flex items-center gap-1 text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                            <CheckCircle2 className="h-2.5 w-2.5" /> VERIFIED
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[9px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                            <Clock className="h-2.5 w-2.5 animate-pulse" /> AWAITING VERIFICATION
                                          </span>
                                        )
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[9px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                          <Clock className="h-2.5 w-2.5" /> ACTIVE
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Objective Description */}
                                  <p className="text-[11px] text-[var(--foreground-muted)] mb-4 leading-relaxed line-clamp-3">
                                    {task.description || "No specific operational objective declared."}
                                  </p>
                                </div>

                                <div className="border-t border-[var(--surface-border)]/50 pt-4 flex items-center justify-between">
                                  {/* Deadline & Priority Info */}
                                  <div className="flex items-center gap-4 text-[10px] text-[var(--foreground-subtle)] font-bold">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3.5 w-3.5" />
                                      {task.deadline ? new Date(task.deadline).toLocaleDateString([], { month: "short", day: "numeric" }) : "—"}
                                    </div>
                                    <div>
                                      <span className={cn(
                                        "px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider",
                                        task.priority === "urgent" && "text-red-400 border-red-500/20 bg-red-500/5",
                                        task.priority === "high" && "text-amber-400 border-amber-500/20 bg-amber-500/5",
                                        task.priority === "medium" && "text-violet-400 border-violet-500/20 bg-violet-500/5",
                                        task.priority === "low" && "text-cyan-400 border-cyan-500/20 bg-cyan-500/5"
                                      )}>
                                        {task.priority || "medium"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Submission button */}
                                  <div>
                                    {task.status !== "completed" ? (
                                      <Link
                                        href={`/employee/logs?task=${task.id}`}
                                        className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5 border border-indigo-500/20 rounded-md px-3 py-1.5 transition-all"
                                      >
                                        Submit Log <ExternalLink className="h-2.5 w-2.5" />
                                      </Link>
                                    ) : (
                                      <span className="text-[10px] text-[var(--foreground-subtle)] font-semibold italic">
                                        Log committed
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
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

export default function EmployeeTasksPage() {
  return (
    <Container title="Directives & Initiatives" subtitle="Telemetry verification dashboard and execution logs portal.">
      <Suspense fallback={
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      }>
        <TasksContent />
      </Suspense>
    </Container>
  );
}