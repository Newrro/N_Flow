'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function uploadDocumentRecord(data: {
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}) {
  // This is deprecated/no longer used as files are uploaded directly when completing tasks (submitting logs).
  return { success: true };
}

export async function getDocuments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Check user role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError);
    return [];
  }

  // Fetch all logs that have proof_url uploads, joining task, project, and profile details
  const { data: logs, error } = await supabase
    .from('logs')
    .select(`
      id,
      proof_url,
      created_at,
      description,
      profiles:user_id (
        id,
        name,
        employee_id
      ),
      tasks:task_id (
        id,
        title,
        project:project_id (
          id,
          name,
          allowed_employees
        )
      )
    `)
    .not('proof_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching task proofs for Document Center:', error);
    return [];
  }

  // Filter based on allowed employee access rules
  const accessibleLogs = logs.filter((log: any) => {
    // 1. Admins have global access to all task proofs
    if (profile.role === 'admin') return true;

    // 2. Employees only see logs belonging to projects they have been authorized for
    const rawTask = log.tasks;
    const task = Array.isArray(rawTask) ? rawTask[0] : rawTask;
    const rawProject = task?.project;
    const project = Array.isArray(rawProject) ? rawProject[0] : rawProject;

    if (project) {
      const allowedIds = Array.isArray(project.allowed_employees) 
        ? project.allowed_employees 
        : [];
      return allowedIds.includes(user.id);
    }

    // 3. If there is no project, check if they are the uploader of this individual proof
    const rawProfile = log.profiles;
    const profileObj = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
    return profileObj?.id === user.id;
  });

  // Map to beautiful document objects
  return accessibleLogs.map((log: any) => {
    const rawUrl = log.proof_url || '';
    const urlParts = rawUrl.split('/');
    const rawFilename = urlParts[urlParts.length - 1] || 'Proof_File';
    
    // Remove the numeric timestamp prefix (e.g. "1780385760711_file.png" -> "file.png")
    const cleanedName = rawFilename.replace(/^\d+_/, '');

    const rawTask = log.tasks;
    const task = Array.isArray(rawTask) ? rawTask[0] : rawTask;
    const rawProject = task?.project;
    const project = Array.isArray(rawProject) ? rawProject[0] : rawProject;

    const rawProfile = log.profiles;
    const profileObj = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

    return {
      id: log.id,
      name: cleanedName,
      file_url: log.proof_url,
      file_type: cleanedName.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? 'image/png' : 'application/pdf',
      file_size: 0, // Inferred
      created_at: log.created_at,
      uploaded_by: profileObj?.id || '',
      uploaded_by_name: profileObj?.name || 'Unknown Personnel',
      employee_id: profileObj?.employee_id || 'N/A',
      task_title: task?.title || 'General Initiative',
      task_id: task?.id || 'none',
      project_name: project?.name || 'Individual Assignments',
      project_id: project?.id || 'none',
    };
  });
}

export async function deleteDocument(id: string, fileUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Delete from logs storage bucket
  const pathParts = fileUrl.split('/');
  let storagePath = fileUrl;
  
  // The proof_url is usually uploaded under 'logs' bucket, file name format: 'userId/timestamp_name'
  // If the path contains 'logs', we extract everything after it
  const bucketIndex = pathParts.indexOf('logs');
  if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
    storagePath = pathParts.slice(bucketIndex + 1).join('/');
  }

  console.log(`De-allocating storage file from logs bucket: ${storagePath}`);
  const { error: storageError } = await supabase.storage
    .from('logs')
    .remove([storagePath]);

  if (storageError) {
    console.error('Warning: Error removing from logs storage bucket:', storageError.message);
  }

  // 2. Set proof_url and file_hash to null in logs database table
  const { error: dbError } = await supabase
    .from('logs')
    .update({
      proof_url: null,
      file_hash: null
    })
    .eq('id', id);

  if (dbError) {
    console.error('Error updating log table proof columns:', dbError);
    return { error: dbError.message };
  }

  revalidatePath('/admin/documents');
  revalidatePath('/employee/documents');
  return { success: true };
}
