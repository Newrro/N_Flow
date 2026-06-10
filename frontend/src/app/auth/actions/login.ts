'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(input: FormData | { email: string; password: string }) {
  let email: string;
  let password: string;

  if (input instanceof FormData) {
    email = input.get('email') as string;
    password = input.get('password') as string;
  } else {
    email = input.email;
    password = input.password;
  }
  
  const supabase = await createClient()

  const { error, data: { user } } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      redirect('/admin/choose')
    } else if (profile?.role === 'employee') {
      redirect('/employee/dashboard')
    } else {
      return { error: 'User profile or role not found. Please contact an administrator.' }
    }
  }

  return { success: true }
}
