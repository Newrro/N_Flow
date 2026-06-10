"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getTasks, deleteTask, updateTaskStatus, verifyTask, getProjects, deleteProject, getEmployees } from "../actions/tasks";
import { CreateTaskModal } from "@/components/admin/CreateTaskModal";
import { CreateProjectModal } from "@/components/admin/CreateProjectModal";
import { EditTaskModal } from "@/components/admin/EditTaskModal";
import { ManageProjectAccessModal } from "@/components/admin/ManageProjectAccessModal";
import { Container } from "@/components/ui/Container";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trash2, Plus, Search, Filter, CheckCircle2, Clock, ListTodo, Calendar, MoreVertical, LayoutGrid, List, ChevronDown, ChevronUp, Edit, Users } from "lucide-react";

const priorityBadge: Record<string, string> = {
  low: "badge-cyan",
  medium: "badge-violet",
  high: "badge-amber",
  urgent: "badge-red",
};

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Edit & Access states
  const [taskToEdit, setTaskToEdit] = useState<any>(null);
  const [projectToManage, setProjectToManage] = useState<any>(null);

  const toggleProjectExpand = (id: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const [tData, pData, empData] = await Promise.all([getTasks(), getProjects(), getEmployees()]);
      setTasks(tData);
      setProjects(pData);
      setEmployees(empData);
    } catch (e) {
      console.error("Error loading task control console:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to decommission this task?")) return;
    try {
      await deleteTask(id);
      fetchTasks();
    } catch (e) {
      alert("Failed to decommission task");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to decommission this project? All associated tasks will be removed.")) return;
    try {
      await deleteProject(id);
      fetchTasks();
    } catch (e) {
      alert("Failed to decommission project");
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await updateTaskStatus(taskId, status);
      fetchTasks();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleVerify = async (taskId: string) => {
    try {
      await verifyTask(taskId);
      fetchTasks();
    } catch (err) {
      alert("Failed to verify task");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const summary = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return { total, completed, pipeline: total - completed };
  }, [tasks]);

  // Group tasks by project
  const groupedTasks = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    // Initialize groups for all loaded projects
    projects.forEach((p) => {
      groups[p.id] = [];
    });
    
    // Group "unassigned" tasks under "none"
    groups["none"] = [];
    
    filtered.forEach((t) => {
      const pid = t.project_id || "none";
      if (!groups[pid]) {
        groups[pid] = [];
      }
      groups[pid].push(t);
    });
    
    return groups;
  }, [filtered, projects]);

  const renderTaskCard = (task: any, index: number) => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
    >
      <div className="dark-card flex h-full flex-col p-6 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-[var(--surface-1)]/80 backdrop-blur-md relative overflow-hidden group">
        <div className="absolute inset-0 border border-transparent group-hover:border-[var(--brand-primary)]/20 rounded-xl transition-all duration-300 pointer-events-none" />

        {/* 1. Project Title at the top */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--brand-accent)] bg-[var(--brand-primary-dim)]/30 px-2.5 py-1 rounded-md border border-[rgba(99,102,241,0.15)] truncate max-w-[150px]">
            📁 {task.project?.name || "Individual Initiative"}
          </span>
          {task.status === "completed" ? (
            task.is_verified ? (
              <span className="badge badge-green text-[9px] px-2 py-0.5 rounded font-black tracking-wider flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5" /> Verified</span>
            ) : (
              <span className="badge bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] px-2 py-0.5 rounded font-black tracking-wider flex items-center gap-1"><Clock className="h-2.5 w-2.5 animate-pulse" /> Awaiting Verification</span>
            )
          ) : (
            <span className="badge badge-amber text-[9px] px-2 py-0.5 rounded font-black tracking-wider flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Active</span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-5 right-5 z-10 bg-[var(--surface-1)] p-1 rounded-lg border border-[var(--surface-border)] shadow-md">
          {task.status === "completed" && !task.is_verified && (
            <button 
              type="button" 
              onClick={() => handleVerify(task.id)}
              className="rounded-md p-1 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 hover:text-emerald-300 transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2"
              title="Verify Task"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Verify
            </button>
          )}
          {task.status !== "completed" && (
            <button 
              type="button" 
              onClick={() => handleStatusChange(task.id, "completed")}
              className="rounded-lg p-1 text-green-500/50 hover:bg-green-500/10 hover:text-green-500 transition-all"
              title="Mark Completed"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button 
            type="button" 
            onClick={() => setTaskToEdit(task)}
            className="rounded-lg p-1 text-[var(--foreground-subtle)] hover:bg-[var(--surface-3)] hover:text-[var(--brand-primary)] transition-all"
            title="Edit Task"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
            <button 
              type="button" 
              onClick={() => handleDelete(task.id)}
              className="rounded-lg p-1 text-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition-all"
              title="Decommission Task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

        {/* 2. Task Title */}
        <h3 className="font-extrabold text-sm leading-tight text-[var(--foreground)] tracking-tight">{task.title}</h3>
        <p className="mt-2 text-xs text-[var(--foreground-muted)] line-clamp-2 flex-1">
          {task.description || "No description provided."}
        </p>

        {/* 3. Employee and Difficulty Level on the right */}
        <div className="mt-4 flex items-center justify-between border-t border-[var(--surface-border)]/50 pt-3">
          {/* Employee */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--brand-primary-dim)] border border-[rgba(99,102,241,0.2)] text-xs font-bold text-[var(--brand-accent)]">
              {task.profiles?.name?.charAt(0) || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[var(--foreground)] truncate leading-none">{task.profiles?.name || "Unassigned"}</p>
              <p className="text-[9px] text-[var(--foreground-subtle)] mt-0.5 leading-none">ID: {task.profiles?.employee_id || "N/A"}</p>
            </div>
          </div>

          {/* Difficulty Level on the right */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border leading-none",
              task.priority === "urgent" && "bg-red-500/10 text-red-400 border-red-500/20",
              task.priority === "high" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
              task.priority === "medium" && "bg-violet-500/10 text-violet-400 border-violet-500/20",
              task.priority === "low" && "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
            )}>
              {task.priority || "medium"}
            </span>
            <span className="text-[8px] text-[var(--foreground-subtle)] font-bold mt-0.5 leading-none">
              📅 {task.deadline ? new Date(task.deadline).toLocaleDateString([], { month: "short", day: "numeric" }) : "—"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <Container
      title="Strategic Task Control"
      subtitle="Oversee mission-deliverables, establish project categories, and assign initiatives."
      actions={
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-lg bg-[var(--surface-2)] border border-[var(--surface-border)] p-1">
            {(["grid", "list"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  "rounded-md p-1.5 transition-all",
                  viewMode === mode
                    ? "bg-[var(--surface-3)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)]"
                )}
              >
                {mode === "grid" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </button>
            ))}
          </div>
          
          <button 
            type="button" 
            onClick={() => setIsProjectModalOpen(true)} 
            className="flex items-center gap-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 font-semibold px-4 py-2.5 text-xs uppercase tracking-wider transition-all"
          >
            <Plus className="h-4 w-4" />
            Establish Project
          </button>

          <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Assign Initiative
          </button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 xl:gap-8">
        {[
          { label: "Total initiatives", value: summary.total, sub: "In registry" },
          { label: "In pipeline", value: summary.pipeline, sub: "Active or pending" },
          { label: "Completed", value: summary.completed, sub: "Closed out" },
        ].map((s, i) => (
          <div key={i} className="dark-card p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-subtle)]">{s.label}</p>
            <p className="mt-2 text-4xl font-black tracking-tight text-[var(--foreground)]">
              {loading ? "—" : s.value}
            </p>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className="dark-card flex flex-col gap-6 p-6 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" />
          <input
            type="search"
            placeholder="Search tasks..."
            className="dark-input w-full py-2.5 pl-10 pr-4 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="button" className="btn-ghost text-xs">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {/* Grouped Task List */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-[var(--surface-1)] border border-[var(--surface-border)]" />
          ))}
        </div>
      ) : filtered.length === 0 && projects.length === 0 ? (
        <div className="dark-card py-16 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--surface-2)]">
            <ListTodo className="h-7 w-7 text-[var(--foreground-subtle)]" />
          </div>
          <h4 className="font-bold text-[var(--foreground)]">Queue exhausted</h4>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">No active tasks or project categories — assign a new initiative.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {projects.map((proj) => {
            const projTasks = groupedTasks[proj.id] || [];
            
            // Calculate project progress percentage based strictly on admin-verified tasks
            const completedCount = projTasks.filter(t => t.status === "completed" && t.is_verified).length;
            const totalCount = projTasks.length;
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            
            const isExpanded = !!expandedProjects[proj.id];

            const allowedIds: string[] = Array.isArray(proj.allowed_employees) ? proj.allowed_employees : [];
            const allowedEmployees = employees.filter((emp) => allowedIds.includes(emp.id));

            return (
              <div key={proj.id} className="space-y-5">
                {/* Project Header - Clickable to expand/collapse */}
                <div 
                  onClick={() => toggleProjectExpand(proj.id)}
                  className="flex flex-col gap-3 border border-[var(--surface-border)] hover:border-[var(--brand-primary)]/40 bg-[var(--surface-2)]/10 hover:bg-[var(--surface-2)]/30 p-5 rounded-xl pb-3 cursor-pointer select-none transition-all duration-300 relative group/header"
                >
                  <div className="absolute right-5 top-5 text-[var(--foreground-subtle)] group-hover/header:text-[var(--foreground)] transition-colors">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-extrabold tracking-tight text-[var(--brand-accent)] flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                        {proj.name}
                      </h3>
                      <p className="text-xs text-[var(--foreground-muted)] mt-1.5 max-w-4xl">
                        {proj.description || "No project objective defined."}
                      </p>
                    </div>
                    
                    {/* Delete button (stop propagation to avoid toggling collapse) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(proj.id);
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500/50 hover:text-red-500 hover:bg-red-500/5 px-2 py-1 rounded-md transition-all border border-transparent hover:border-red-500/20"
                      title="Decommission Project"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Decommission
                    </button>
                  </div>

                  {/* Access List Row inside project header */}
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="flex flex-wrap items-center gap-2 border-t border-[var(--surface-border)]/50 pt-2.5"
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-subtle)] flex items-center gap-1">
                      🔑 Access List ({allowedEmployees.length}):
                    </span>
                    {allowedEmployees.length === 0 ? (
                      <span className="text-[10px] text-[var(--foreground-muted)] italic">No personnel authorized</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {allowedEmployees.map((emp) => (
                          <span key={emp.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--brand-primary-dim)]/20 border border-[rgba(99,102,241,0.15)] text-[var(--foreground)]">
                            {emp.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setProjectToManage(proj)}
                      className="ml-auto flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 border border-emerald-500/20 rounded-md px-2 py-0.5 transition-all"
                      title="Manage Authorized Personnel"
                    >
                      + Manage Access
                    </button>
                  </div>

                  {/* Project Progress line */}
                  <div className="flex items-center gap-4 mt-1 bg-[var(--surface-1)] p-2.5 rounded-lg border border-[var(--surface-border)]/50">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-subtle)] shrink-0">
                      Progress: {progressPercent}%
                    </div>
                    <div className="flex-1 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-[var(--foreground-muted)] shrink-0 font-bold">
                      {completedCount}/{totalCount} tasks completed
                    </div>
                  </div>
                </div>

                {/* Collapsible Tasks Area */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden pt-2"
                  >
                    {projTasks.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[var(--surface-border)]/50 py-8 text-center bg-[var(--surface-1)]/10 backdrop-blur-sm">
                        <p className="text-xs text-[var(--foreground-subtle)] italic">No active deliverables registered under this category.</p>
                      </div>
                    ) : (
                      <div className={cn("grid gap-6 xl:gap-8", viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
                        {projTasks.map((task, index) => renderTaskCard(task, index))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}

          {/* Unassigned Tasks */}
          {groupedTasks["none"] && groupedTasks["none"].length > 0 && (
            <div className="space-y-5">
              <div className="border-b border-[var(--surface-border)] pb-3">
                <h3 className="text-base font-extrabold tracking-tight text-[var(--foreground-subtle)] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                  Individual initiatives
                </h3>
                <p className="text-xs text-[var(--foreground-muted)] mt-1.5">
                  Deliverables deployed outside of standard corporate projects.
                </p>
              </div>

              <div className={cn("grid gap-6 xl:gap-8", viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
                {groupedTasks["none"].map((task, index) => renderTaskCard(task, index))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchTasks} />
      <CreateProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSuccess={fetchTasks} />
      
      <EditTaskModal 
        isOpen={!!taskToEdit} 
        onClose={() => setTaskToEdit(null)} 
        onSuccess={fetchTasks} 
        task={taskToEdit} 
      />

      <ManageProjectAccessModal 
        isOpen={!!projectToManage} 
        onClose={() => setProjectToManage(null)} 
        onSuccess={fetchTasks} 
        project={projectToManage} 
      />
    </Container>
  );
}