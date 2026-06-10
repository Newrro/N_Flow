'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'

export async function recordLogin(remarks?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const today = format(new Date(), 'yyyy-MM-dd')
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('attendance')
    .upsert({ 
      user_id: user.id,
      date: today,
      login_time: now,
      status: 'present',
      remarks: remarks || null,
      updated_at: now
    }, { onConflict: 'user_id,date' })

  if (error) {
    console.error('Error recording login:', error)
    return { error: 'Failed to record login time.' }
  }

  revalidatePath('/employee/dashboard')
  revalidatePath('/employee/attendance')
  return { success: true }
}

export async function recordLogout() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const today = format(new Date(), 'yyyy-MM-dd')
  const now = new Date()
  const nowStr = now.toISOString()

  // 1. Fetch login_time to calculate duration
  const { data: record, error: fetchError } = await supabase
    .from('attendance')
    .select('login_time')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (fetchError || !record?.login_time) {
    return { error: 'Login record not found for today.' }
  }

  const loginTime = new Date(record.login_time)
  const durationMs = now.getTime() - loginTime.getTime()
  const totalHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100

  const { error } = await supabase
    .from('attendance')
    .update({ 
      logout_time: nowStr,
      total_hours: totalHours,
      updated_at: nowStr
    })
    .eq('user_id', user.id)
    .eq('date', today)

  if (error) {
    console.error('Error recording logout:', error)
    return { error: 'Failed to record logout time.' }
  }

  revalidatePath('/employee/dashboard')
  revalidatePath('/employee/attendance')
  revalidatePath(`/admin/employees/${user.id}`)
  return { success: true }
}
