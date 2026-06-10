"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Container } from "@/components/ui/Container";
import { CreateTaskModal } from "@/components/admin/CreateTaskModal";
import { CreateProjectModal } from "@/components/admin/CreateProjectModal";
import { EditTaskModal } from "@/components/admin/EditTaskModal";
import { ManageProjectAccessModal } from "@/components/admin/ManageProjectAccessModal";
import {
  Users, CheckSquare, ClipboardList, ArrowUpRight,
  Plus, Folder, Shield, Zap, ChevronDown, ChevronUp, Clock, CheckCircle2, Edit
} from "lucide-react";
import { getDashboardStats } from "../actions/stats";
import { getProjects, getTasks, getEmployees, verifyTask } from "../actions/tasks";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  
  // Expanded project panel state
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Edit & Access states
  const [taskToEdit, setTaskToEdit] = useState<any>(null);
  const [projectToManage, setProjectToManage] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      const [statsData, projData, taskData, empData] = await Promise.all([
        getDashboardStats(),
        getProjects(),
        getTasks(),
        getEmployees()
      ]);
      setStats(statsData);
      setProjects(projData);
      setTasks(taskData);
      setEmployees(empData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleVerify = async (taskId: string) => {
    try {
      await verifyTask(taskId);
      fetchDashboardData();
    } catch (err) {
      alert("Failed to verify task");
    }
  };

  const metricCards = [
    { label: "Active Personnel", value: stats?.employees, icon: Users, color: "text-[var(--brand-secondary)]", glow: "rgba(34,211,238,0.12)", border: "rgba(34,211,238,0.15)" },
    { label: "Pending Tasks", value: stats?.activeTasks, icon: CheckSquare, color: "text-[var(--brand-primary)]", glow: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.15)" },
    { label: "Mission Events", value: stats?.recentLogs, icon: ClipboardList, color: "text-[var(--brand-accent)]", glow: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.15)" },
  ];

  // Group tasks by project to calculate metrics
  const projectMetrics = useMemo(() => {
    const metrics: Record<string, { total: number; completed: number; progress: number; tasks: any[] }> = {};
    
    projects.forEach((p) => {
      metrics[p.id] = { total: 0, completed: 0, progress: 0, tasks: [] };
    });

    tasks.forEach((t) => {
      const pid = t.project_id;
      if (pid && metrics[pid]) {
        metrics[pid].tasks.push(t);
        metrics[pid].total += 1;
        if (t.status === "completed" && t.is_verified) {
          metrics[pid].completed += 1;
        }
      }
    });

    // Calculate progress based strictly on verified completions
    Object.keys(metrics).forEach((pid) => {
      const { total, completed } = metrics[pid];
      metrics[pid].progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    });

    return metrics;
  }, [projects, tasks]);

  const toggleExpandProject = (id: string) => {
    setExpandedProjectId((prev) => (prev === id ? null : id));
  };

  return (
    <Container
      title="Executive Overview"
      subtitle={`System synchronization active — telemetry verified at ${stats?.lastUpdate || "--:--"}`}
    >
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
        {metricCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="dark-card group relative overflow-hidden p-6"
              style={{ borderColor: card.border, boxShadow: `0 4px 24px ${card.glow}, 0 1px 0 rgba(255,255,255,0.04) inset` }}
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-10 blur-2xl"
                style={{ background: card.glow.replace("0.12", "1").replace("0.1", "1") }} />
              <div className="mb-4 flex items-center justify-between">
                <div className={cn("rounded-lg p-2.5", card.color, "bg-[rgba(255,255,255,0.05)]")}>
                  <card.icon className="h-6 w-6" />
                </div>
                <span className="badge badge-green">
                  <ArrowUpRight className="h-2.5 w-2.5" /> High Sync
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--foreground-muted)]">{card.label}</p>
              {loading ? (
                <div className="mt-1.5 h-10 w-20 animate-pulse rounded-lg bg-[var(--surface-3)]" />
              ) : (
                <h3 className="mt-1 text-4xl font-black tracking-tight text-[var(--foreground)]">{card.value}</h3>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Collapsible Strategic Projects & Initiatives Explorer panel */}
      <div className="dark-card flex flex-col overflow-hidden bg-gradient-to-b from-[var(--surface-1)] to-[var(--surface-2)] mt-8">
        <div className="flex items-center justify-between border-b border-[var(--surface-border)] px-8 py-7 bg-[var(--surface-2)]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-primary-dim)] border border-[rgba(99,102,241,0.2)] text-[var(--brand-primary)]">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--foreground)]">Strategic Projects & Initiatives</h2>
              <p className="text-xs text-[var(--foreground-muted)]">Audit established deliverables, verify task completions, and track telemetry.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-3)] px-3 py-1.5 shadow-sm">
            <span className="pulse-dot green" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Telemetry Sync</span>
          </div>
        </div>

        <div className="p-8 space-y-4">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-16 bg-[var(--surface-3)] rounded-lg" />
              <div className="h-16 bg-[var(--surface-3)] rounded-lg" />
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--surface-border)] py-16 text-center bg-[var(--surface-1)]">
              <Folder className="mx-auto h-12 w-12 text-[var(--foreground-subtle)] opacity-10 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-[var(--foreground-subtle)]">No established projects recorded.</p>
            </div>
          ) : (
            projects.map((proj) => {
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
                              <div className="flex items-center justify-between pl-1">
                                <p className="text-xs text-[var(--foreground-muted)] italic">No personnel have been granted access to this category.</p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProjectToManage(proj);
                                  }}
                                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 border border-emerald-500/20 rounded-md px-2 py-0.5 transition-all"
                                >
                                  + Manage Access
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2.5 items-center">
                                {allowedEmployees.map((emp) => (
                                  <div 
                                    key={emp.id}
                                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-1)] text-[11px] font-bold text-[var(--foreground)]"
                                  >
                                    <div className="flex h-4.5 w-4.5 items-center justify-center rounded bg-[var(--brand-primary-dim)] text-[9px] font-bold uppercase text-[var(--brand-accent)]">
                                      {emp.name.charAt(0)}
                                    </div>
                                    <p className="leading-none">{emp.name}</p>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProjectToManage(proj);
                                  }}
                                  className="ml-auto flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 border border-emerald-500/20 rounded-md px-2.5 py-1 transition-all"
                                >
                                  + Manage Access
                                </button>
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
                                    {metrics.tasks.map((task) => (
                                      <tr key={task.id} className="hover:bg-[var(--surface-2)]/30 transition-colors">
                                        <td className="p-3 max-w-[180px] truncate">
                                          <p className="font-bold">{task.title}</p>
                                          {task.description && <p className="text-[10px] text-[var(--foreground-muted)] truncate mt-0.5">{task.description}</p>}
                                        </td>
                                        <td className="p-3">
                                          {task.profiles ? (
                                            <span className="flex items-center gap-1.5">
                                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                                              {task.profiles.name}
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

                                            {task.status === "completed" && !task.is_verified && (
                                              <button
                                                type="button"
                                                onClick={() => handleVerify(task.id)}
                                                className="px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 hover:text-emerald-300 transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-wider"
                                                title="Verify Task Completion"
                                              >
                                                <CheckCircle2 className="h-3 w-3" /> Verify
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => setTaskToEdit(task)}
                                              className="p-1 hover:bg-[var(--surface-3)] rounded text-[var(--foreground-subtle)] hover:text-[var(--brand-primary)] transition-colors"
                                              title="Edit Task"
                                            >
                                              <Edit className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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

      {/* Modals */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
      <EditTaskModal
        isOpen={!!taskToEdit}
        onClose={() => setTaskToEdit(null)}
        onSuccess={fetchDashboardData}
        task={taskToEdit}
      />
      <ManageProjectAccessModal
        isOpen={!!projectToManage}
        onClose={() => setProjectToManage(null)}
        onSuccess={fetchDashboardData}
        project={projectToManage}
      />
    </Container>
  );
}