"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export async function getEmployees() {
  const supabase = await createClient();

  const { data: employees, error } = await supabase
    .from("profiles")
    .select("id, name, employee_id, role")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching employees:", error);
    return [];
  }

  return employees;
}

export async function getProjects() {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }

  return projects;
}

export async function getTasks() {
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(`
      *,
      profiles:assigned_to (
        id,
        name,
        employee_id
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return tasks;
}

export async function createTask(data: {
  id?: string;
  title: string;
  description: string;
  priority: TaskPriority;
  deadline: string;
  assigned_to: string[];
  project_id?: string;
}) {
  const supabase = await createClient();
  const { id, title, description, priority, deadline, assigned_to, project_id } = data;

  const deadlineISO = deadline ? new Date(deadline).toISOString() : null;

  try {
    if (id) {
      // Decomposing templates for multiple assignees
      // First employee updates the template task
      if (assigned_to.length > 0) {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({
            assigned_to: assigned_to[0],
            priority,
            deadline: deadlineISO,
            status: "pending",
            is_verified: false,
          })
          .eq("id", id);

        if (updateError) throw updateError;

        // Remaining employees get new duplicate tasks
        if (assigned_to.length > 1) {
          const insertData = assigned_to.slice(1).map((empId) => ({
            title,
            description,
            priority,
            deadline: deadlineISO,
            assigned_to: empId,
            project_id: project_id || null,
            status: "pending",
            is_verified: false,
          }));

          const { error: insertError } = await supabase.from("tasks").insert(insertData);
          if (insertError) throw insertError;
        }
      }
    } else {
      // New custom task assignment
      const insertData = assigned_to.map((empId) => ({
        title,
        description,
        priority,
        deadline: deadlineISO,
        assigned_to: empId,
        project_id: project_id || null,
        status: "pending",
        is_verified: false,
      }));

      const { error: insertError } = await supabase.from("tasks").insert(insertData);
      if (insertError) throw insertError;
    }

    revalidatePath("/admin/tasks");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/employees/[id]", "page");
    revalidatePath("/employee/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating/assigning task:", error);
    return { error: error.message || "Failed to assign tasks." };
  }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    console.error("Error deleting task:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/admin/dashboard");
  revalidatePath("/employee/dashboard");
  return { success: true };
}

export async function updateTask(
  taskId: string,
  data: {
    title: string;
    description: string;
    priority: TaskPriority;
    deadline: string;
    assigned_to: string | null;
    project_id: string | null;
  }
) {
  const supabase = await createClient();
  const { title, description, priority, deadline, assigned_to, project_id } = data;

  const deadlineISO = deadline ? new Date(deadline).toISOString() : null;

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      description,
      priority,
      deadline: deadlineISO,
      assigned_to: assigned_to || null,
      project_id: project_id || null,
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error updating task:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/employees/[id]", "page");
  revalidatePath("/employee/dashboard");
  return { success: true };
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient();

  // If status is completed by admin directly, auto-verify it
  const updates: any = { status };
  if (status === "completed") {
    updates.is_verified = true;
  }

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId);

  if (error) {
    console.error("Error updating task status:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/employees/[id]", "page");
  revalidatePath("/employee/dashboard");
  return { success: true };
}

export async function verifyTask(taskId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ is_verified: true, status: "completed" })
    .eq("id", taskId);

  if (error) {
    console.error("Error verifying task:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/employees/[id]", "page");
  revalidatePath("/employee/dashboard");
  return { success: true };
}

export async function createProject(data: {
  name: string;
  description: string;
  allowed_employees: string[];
  tasks?: { title: string; description: string }[];
}) {
  const supabase = await createClient();
  const { name, description, allowed_employees, tasks } = data;

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name,
        description,
        allowed_employees: allowed_employees || [],
      })
      .select()
      .single();

    if (projectError) throw projectError;

    if (tasks && tasks.length > 0 && project) {
      const taskInserts = tasks.map((t) => ({
        title: t.title,
        description: t.description,
        project_id: project.id,
        status: "pending",
        is_verified: false,
        assigned_to: null,
        priority: "medium" as TaskPriority,
      }));

      const { error: tasksError } = await supabase.from("tasks").insert(taskInserts);
      if (tasksError) throw tasksError;
    }

    revalidatePath("/admin/tasks");
    revalidatePath("/admin/dashboard");
    revalidatePath("/employee/dashboard");
    return { success: project };
  } catch (error: any) {
    console.error("Error creating project:", error);
    return { error: error.message || "Failed to create project." };
  }
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    console.error("Error deleting project:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/admin/dashboard");
  revalidatePath("/employee/dashboard");
  return { success: true };
}

export async function updateProjectAllowedEmployees(projectId: string, allowed_employees: string[]) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({ allowed_employees })
    .eq("id", projectId);

  if (error) {
    console.error("Error updating project allowed employees:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/admin/dashboard");
  revalidatePath("/employee/dashboard");
  return { success: true };
}
