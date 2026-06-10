'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: {
  name: string;
  email: string;
  employee_id: string;
  role: 'admin' | 'employee';
  password: string;
}) {
  const supabase = await createClient()
  
  // 1. Verify Requesting User is an Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Only admins can manage personnel.')
  }

  // 2. Create User via Admin Client (Service Role)
  const adminClient = createAdminClient()
  
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: {
      name: formData.name,
      role: formData.role,
      employee_id: formData.employee_id
    }
  })

  if (authError) throw authError
  if (!authUser.user) throw new Error('Failed to create user account.')

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  
  // 1. Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')

  const adminClient = createAdminClient()
  
  // 2. Delete Auth User first (cascades to profile)
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) throw error

  revalidatePath('/admin/users')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function resetUserPassword(userId: string, newPass: string) {
  const supabase = await createClient()
  
  // 1. Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')

  const adminClient = createAdminClient()
  
  // 2. Update Password via Admin SDK
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPass
  })
  if (error) throw error

  return { success: true }
}

export async function updateUser(userId: string, data: {
  name?: string;
  email?: string;
  employee_id?: string;
  role?: 'admin' | 'employee';
}) {
  const supabase = await createClient()
  
  // 1. Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')

  const adminClient = createAdminClient()
  
  // 2. Update Auth (Email) if provided
  if (data.email) {
    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
      email: data.email
    })
    if (authError) throw authError
  }

  // 3. Update Profile (Name, Employee ID, Role, Email)
  const updateData: any = {}
  if (data.name) updateData.name = data.name
  if (data.employee_id) updateData.employee_id = data.employee_id
  if (data.role) updateData.role = data.role
  if (data.email) updateData.email = data.email

  if (Object.keys(updateData).length > 0) {
    const { error: profileError } = await adminClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
    
    if (profileError) throw profileError
  }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/employees/${userId}`)
  return { success: true }
}

export async function getPersonnel() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
