import React from "react";
import { Container } from "@/components/ui/Container";
import { AlertCircle, Briefcase, ListTodo, Shield, Activity, ChevronRight, Zap, ShieldCheck, Timer, Calendar } from "lucide-react";
import LogSubmissionForm from "@/components/employee/LogSubmissionForm";
import { AttendanceActions } from "@/components/employee/AttendanceActions";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { getEmployeeDetailMetrics } from "@/lib/analytics";
import { redirect } from "next/navigation";
import * as motion from "framer-motion/client";
import { EmployeeProjectsPanel } from "@/components/employee/EmployeeProjectsPanel";
import { getProjects, getTasks, getEmployees } from "@/app/admin/actions/tasks";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EmployeeDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch real metrics
  const { logs, tasks } = await getEmployeeDetailMetrics(user.id);

  // 2. Fetch projects, tasks, and employees for the Projects panel
  const [allProjects, allTasks, allEmployees] = await Promise.all([
    getProjects(),
    getTasks(),
    getEmployees(),
  ]);

  // 3. Fetch Attendance Status for Today
  const today = new Date().toISOString().split('T')[0];
  const { data: attendance } = await supabase
    .from('attendance')
    .select('status, verified_by_admin, login_time, logout_time, total_hours, remarks')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  // Metrics calculation
  const activeTasksCount = tasks.filter(t => t.status !== 'completed').length;
  const verifiedLogsCount = logs.length;
  
  const totalHours = logs.reduce((acc, l) => {
    const s = new Date(l.start_time).getTime();
    const e = new Date(l.end_time).getTime();
    return acc + (e - s) / (1000 * 60 * 60);
  }, 0);

  const stats = [
    { name: "Active Assignments", value: activeTasksCount.toString().padStart(2, '0'), icon: Zap, color: "text-[var(--status-warning)]" },
    { name: "Verified Logs", value: verifiedLogsCount.toString().padStart(2, '0'), icon: ShieldCheck, color: "text-[var(--brand-accent)]" },
    { name: "Aggregate Mission", value: `${Math.round(totalHours * 10) / 10}h`, icon: Timer, color: "text-[var(--brand-secondary)]" },
  ];

  return (
    <Container title="Operational Terminal" subtitle="Personal workflow orchestration and mission-critical status monitoring.">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-6 lg:gap-8"
      >
        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 xl:gap-8">
          {stats.map((stat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="dark-card flex items-center gap-6 p-8 bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]"
            >
              <div className={cn("rounded-lg bg-[var(--surface-3)] p-3 border border-[var(--surface-border)]", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">{stat.name}</p>
                <h3 className="text-3xl font-black tracking-tight text-[var(--foreground)]">{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 xl:gap-8">
          {/* Main Column: Strategic Projects & Initiatives */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <EmployeeProjectsPanel
              projects={allProjects}
              tasks={allTasks}
              employees={allEmployees}
              currentUserId={user.id}
            />
          </div>

          {/* Right Column: Protocols & Status */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="dark-card overflow-hidden bg-gradient-to-b from-[var(--surface-1)] to-[var(--surface-2)]">
               <div className="flex items-center justify-between border-b border-[var(--surface-border)] p-8 bg-[var(--surface-2)]/50 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                     <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg border",
                        attendance?.status === 'present' ? "bg-[rgba(16,185,129,0.1)] text-[var(--status-success)] border-[rgba(16,185,129,0.1)]" :
                        attendance?.status === 'absent' ? "bg-[rgba(239,68,68,0.1)] text-[var(--status-danger)] border-[rgba(239,68,68,0.1)]" :
                        "bg-[var(--surface-3)] text-[var(--foreground-muted)] border-[var(--surface-border)]"
                     )}>
                        <Activity className="h-5 w-5" />
                     </div>
                     <div>
                        <h3 className="text-sm font-black text-[var(--foreground)] tracking-tight">Deployment</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Mission Status</p>
                     </div>
                  </div>
                  <span className={cn(
                     "badge text-[9px] py-1 font-black uppercase tracking-widest px-3 rounded-md border",
                     attendance?.status === 'present' ? "bg-[rgba(16,185,129,0.1)] text-[var(--status-success)]" :
                     attendance?.status === 'absent' ? "bg-[rgba(239,68,68,0.1)] text-[var(--status-danger)]" :
                     "bg-[var(--surface-3)] text-[var(--foreground-muted)]"
                  )}>
                     {attendance?.status || 'Active Sync'}
                  </span>
               </div>
               <div className="p-8 space-y-6">
                  <p className="text-[10px] font-medium text-[var(--foreground-muted)] leading-relaxed italic">
                     {attendance?.status === 'present' ? "Deployment verified. Operational logs active." : 
                      attendance?.status === 'absent' ? "Strategic Absence: Authorization required." :
                      "Systems operational. Waiting for mission log initiation."}
                  </p>
                  
                  <AttendanceActions initialAttendance={attendance} />
               </div>
            </div>

            <div className="dark-card flex flex-col overflow-hidden bg-gradient-to-b from-[var(--surface-1)] to-[var(--surface-2)]">
              <div className="flex items-center gap-4 border-b border-[var(--surface-border)] p-8 bg-[var(--surface-2)]/50 backdrop-blur-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-3)] text-[var(--brand-accent)] border border-[var(--surface-border)]">
                  <ListTodo className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[var(--foreground)] tracking-tight">Active Protocols</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">{activeTasksCount} Assignments</p>
                </div>
              </div>
              <div className="space-y-4 p-8">
                {tasks.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-[var(--surface-border)] py-10 text-center bg-[var(--surface-1)]">
                    <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-[var(--status-success)] opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Directives Complete</p>
                  </div>
                ) : (
                  tasks.filter(t => t.status !== 'completed').map((task) => (
                    <Link
                      key={task.id}
                      href={`/employee/logs?task=${task.id}`}
                      className="group flex items-center justify-between rounded-xl border border-[var(--surface-border)] bg-[var(--surface-3)]/30 p-4 transition-all hover:bg-[var(--surface-3)] hover:border-[var(--brand-accent-dim)] w-full text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                          task.priority === "urgent" ? "bg-[rgba(239,68,68,0.1)] text-[var(--status-danger)]" : "bg-[var(--surface-3)] text-[var(--foreground-subtle)]"
                        )}>
                          {task.priority === "urgent" ? <Shield className="h-4.5 w-4.5" /> : <Briefcase className="h-4.5 w-4.5" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-[var(--foreground)] leading-tight">{task.title}</p>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mt-1">{task.priority}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)] group-hover:text-[var(--brand-accent)] group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Container>
  );
}