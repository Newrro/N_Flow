'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitWorkLog(formData: {
  task_id: string;
  start_time: string;
  end_time: string;
  description: string;
  proof_url: string;
  file_hash: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Insert the Log
  const { data: log, error } = await supabase
    .from('logs')
    .insert([{
      user_id: user.id,
      task_id: formData.task_id,
      start_time: formData.start_time,
      end_time: formData.end_time,
      description: formData.description,
      proof_url: formData.proof_url,
      file_hash: formData.file_hash
    }])
    .select()
    .single();

  if (error) throw error;

  // 2. Mark the corresponding task as completed
  const { error: taskError } = await supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('id', formData.task_id);

  if (taskError) {
    console.error('Error marking task as completed upon log submission:', taskError);
  }

  revalidatePath('/employee/dashboard');
  revalidatePath('/employee/tasks');
  revalidatePath('/admin/tasks');
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/analytics');
  
  return { success: true, logId: log.id };
}


export async function getAssignedTasks() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('tasks')
    .select('*, project:project_id(id, name)')
    .eq('assigned_to', user.id)
    .neq('status', 'completed');

  if (error) throw error;
  return data;
}

export async function getMyTasks() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select(
      `
      *,
      profiles:assigned_to (
        name,
        employee_id
      ),
      project:project_id (
        id,
        name
      )
    `
    )
    .eq('assigned_to', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getMyTasks', error);
    return [];
  }

  return data ?? [];
}

export async function getWeeklyHours() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('logs')
    .select('start_time, end_time')
    .eq('user_id', user.id)
    .gte('created_at', startOfWeek.toISOString());

  if (error) throw error;

  const totalMilliseconds = data.reduce((acc, log) => {
    const start = new Date(log.start_time).getTime();
    const end = new Date(log.end_time).getTime();
    return acc + (end - start);
  }, 0);

  return (totalMilliseconds / (1000 * 60 * 60)).toFixed(1);
}
